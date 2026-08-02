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
import { createLead, markNotified } from "@/lib/leads/store";
import { normalizeLead, validateLead, type LeadInput } from "@/lib/leads/schema";
import { consume } from "@/lib/rate-limit/store";
import { clientKey } from "@/lib/rate-limit/window";
import { readSettings } from "@/lib/settings/store";

export type LeadKind = LeadInput["kind"];
export type Lead = LeadInput;

export type LeadResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the lead, then tries to tell the team.
 *
 * The write is the part that must not be lost, so it happens first and alone.
 * The email is best-effort: an unconfigured or unreachable Resend leaves
 * `notifiedAt` null on a row that is already safe, which is a state the
 * dashboard can show and somebody can act on. Failing the whole submission
 * because a mail API blinked would throw away the lead instead.
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

  const sent = await sendLeadNotification(lead, wording);
  if (sent.ok) {
    /* Best-effort too: if this update fails the lead is still recorded, and the
       worst case is a notified lead that looks un-notified in the dashboard. */
    await markNotified(saved.id).catch((error) => {
      console.error("[lead] notified flag not written", saved.id, error);
    });
  } else if (sent.reason === "failed") {
    console.error("[lead] notification email failed", saved.id, sent.detail);
  }
}

/**
 * Enquiries per connection per hour.
 *
 * Higher than the login limit because a real person genuinely might send two —
 * the booking form and then the contact form — and low enough that a script
 * cannot fill the pipeline with rubbish and every one of them an email to the
 * team.
 */
const LEADS_PER_HOUR = 8;

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
