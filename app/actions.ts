"use server";

/**
 * Lead capture.
 *
 * The booking funnel and the contact form both land here. Validation is shared
 * with the admin side through `lib/leads/schema`, the row is written by
 * `lib/leads/store`, and the team is emailed after the write rather than before
 * it — see `deliver` below for why the order matters.
 */

import { headers } from "next/headers";
import { sendLeadNotification } from "@/lib/email";
import { appendLeadRow } from "@/lib/sheets/store";
import { createLead, markNotified } from "@/lib/leads/store";
import { normalizeLead, validateLead, type LeadInput } from "@/lib/leads/schema";
import { consume } from "@/lib/rate-limit/store";
import { clientKey } from "@/lib/rate-limit/window";
import { readSettings } from "@/lib/settings/store";

export type LeadKind = LeadInput["kind"];
export type Lead = LeadInput;

export type LeadResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the lead, then tries to tell the team — by email, and by appending a
 * row to the shared Google Sheet.
 *
 * The database write is the part that must not be lost, so it happens first and
 * alone. Both notifications are best-effort: an unconfigured or unreachable SMTP
 * host leaves `notifiedAt` null on a row that is already safe, which is a state
 * the dashboard can show and somebody can act on, and a sheet that refused the
 * append is a copy missing a line rather than a lost enquiry. Failing the whole
 * submission because a third party blinked would throw the lead away instead.
 *
 * The two run together rather than in sequence. Neither can throw and neither
 * depends on the other, so the visitor waits for the slower one instead of the
 * sum of both — on a form submission that difference is visible.
 */
async function deliver(lead: LeadInput) {
  const saved = await createLead(lead);

  /* The two lines an administrator can change from `/admin/settings`. Read
     after the write and defended, because a settings table that is briefly
     unreachable should send the built-in wording rather than nothing. */
  const wording = await readSettings()
    .then((values) => ({
      subjectPrefix: values["email.leadSubject"],
      intro: values["email.leadIntro"],
    }))
    .catch(() => ({}));

  const [sent, appended] = await Promise.all([
    sendLeadNotification(lead, wording),
    appendLeadRow(lead),
  ]);

  if (sent.ok) {
    /* Best-effort too: if this update fails the lead is still recorded, and the
       worst case is a notified lead that looks un-notified in the dashboard. */
    await markNotified(saved.id).catch((error) => {
      console.error("[lead] notified flag not written", saved.id, error);
    });
  } else if (sent.reason === "failed") {
    console.error("[lead] notification email failed", saved.id, sent.detail);
  }

  /* `unconfigured` is silent for both — it is the ordinary state of an
     environment where the credentials have not been pasted in yet, and logging
     it on every submission would bury the failures that mean something. */
  if (!appended.ok && appended.reason === "failed") {
    console.error("[lead] sheet append failed", saved.id, appended.detail);
  }
}

/**
 * Enquiries per connection per hour.
 *
 * Deliberately loose. `clientKey` buckets by IP, and an office, a campus or a
 * phone network behind CGNAT is one address to us — a tight cap there refuses
 * real enquiries from everyone sharing it after the first few, which costs more
 * than the abuse it prevents. What the number still has to do is stop a script
 * from turning one endpoint into an unbounded number of rows, emails and sheet
 * appends; 150 an hour is far above any genuine shared connection and far below
 * Gmail's daily sending ceiling.
 */
const LEADS_PER_HOUR = 150;

export async function submitLead(input: Lead): Promise<LeadResult> {
  const lead = normalizeLead(input);

  const problem = validateLead(lead);
  if (problem) return { ok: false, error: problem };

  /* This is a server action, which means it is a public endpoint that anyone can
     post to directly — the forms it sits behind are not the thing being
     defended against. Every other unauthenticated entry point in the app is
     counted; this one writes a row and sends mail, so it is the one that costs
     most to leave uncounted.

     Failing open when the counter is unreachable, like the rest: losing a real
     enquiry is worse than accepting a duplicate one. */
  try {
    const { allowed } = await consume(`lead:${clientKey(await headers())}`, LEADS_PER_HOUR);
    if (!allowed) {
      return {
        ok: false,
        error: "That's several enquiries from this connection already. Email info@hashmetrik.in and we'll pick it up there.",
      };
    }
  } catch (error) {
    console.error("[lead] rate limit unavailable", error);
  }

  try {
    await deliver(lead);
    return { ok: true };
  } catch (error) {
    console.error("[lead] not saved", error);
    return { ok: false, error: "That didn't send. Try again, or email info@hashmetrik.in." };
  }
}
