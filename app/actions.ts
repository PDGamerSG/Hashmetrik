"use server";

/**
 * Lead capture.
 *
 * The booking funnel and the contact form both land here. Validation is shared
 * with the admin side through `lib/leads/schema`, the row is written by
 * `lib/leads/store`, and the team is emailed after the write rather than before
 * it — see `deliver` below for why the order matters.
 */

import { sendLeadNotification } from "@/lib/email";
import { createLead, markNotified } from "@/lib/leads/store";
import { normalizeLead, validateLead, type LeadInput } from "@/lib/leads/schema";

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

  const sent = await sendLeadNotification(lead);
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

export async function submitLead(input: Lead): Promise<LeadResult> {
  const lead = normalizeLead(input);

  const problem = validateLead(lead);
  if (problem) return { ok: false, error: problem };

  try {
    await deliver(lead);
    return { ok: true };
  } catch (error) {
    console.error("[lead] not saved", error);
    return { ok: false, error: "That didn't send. Try again, or email info@hashmetrik.in." };
  }
}
