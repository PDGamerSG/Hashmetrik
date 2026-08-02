import type { LeadInput } from "@/lib/leads/schema";

/**
 * Transactional email over Resend's REST API.
 *
 * A plain `fetch` rather than the SDK: one endpoint, one shape, and nothing the
 * SDK adds is used here. Kept free of `server-only` so the message builder can
 * be tested directly.
 */
const ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "HashMetrik <leads@hashmetrik.in>";
const DEFAULT_TO = "info@hashmetrik.in";

export type SendResult =
  | { ok: true }
  | { ok: false; reason: "unconfigured" | "failed"; detail?: string };

const LABELS: Array<[keyof LeadInput, string]> = [
  ["name", "Name"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["company", "Company"],
  ["website", "Website"],
  ["industry", "Industry"],
  ["service", "Service"],
  ["budget", "Budget"],
  ["preferredDate", "Preferred date"],
  ["preferredTime", "Preferred time"],
  ["message", "Message"],
];

/**
 * The wording an administrator can change, from `/admin/settings`.
 *
 * Optional, and the shape is deliberately a prefix and an opening line rather
 * than a whole template: the part that must not be editable is the field list,
 * because a template with a placeholder somebody deleted is a notification that
 * quietly stops carrying the phone number.
 */
export type LeadEmailWording = { subjectPrefix?: string; intro?: string };

/** Plain text, because the recipient is the team's own inbox and it has to be scannable. */
export function buildLeadEmail(
  lead: LeadInput,
  wording: LeadEmailWording = {},
): { subject: string; text: string } {
  const source = lead.kind === "booking" ? "Booking request" : "Contact form";
  const lines = LABELS.flatMap(([field, label]) => {
    const value = lead[field];
    return typeof value === "string" && value.length > 0 ? [`${label}: ${value}`] : [];
  });

  /* The source label stays in the subject when nothing is configured: sorting
     bookings from contact-form enquiries at a glance is the job the subject
     does, and a single fixed string for both would take it away. */
  const prefix = wording.subjectPrefix?.trim() || source;
  const intro = wording.intro?.trim() || `${source} from hashmetrik.com`;

  return {
    subject: `${prefix} — ${lead.name}`,
    text: [intro, "", ...lines].join("\n"),
  };
}

/**
 * Sends the team notification.
 *
 * Never throws. The lead is already saved by the time this runs, so a missing
 * key or a bad response is a degraded notification, not a failed submission —
 * the caller records that and moves on.
 */
export async function sendLeadNotification(
  lead: LeadInput,
  wording: LeadEmailWording = {},
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, reason: "unconfigured" };

  const { subject, text } = buildLeadEmail(lead, wording);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || DEFAULT_FROM,
        to: [process.env.LEAD_NOTIFY_EMAIL || DEFAULT_TO],
        /* So hitting reply in the inbox answers the person who wrote in. */
        reply_to: lead.email,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return { ok: false, reason: "failed", detail: `${res.status} ${await res.text()}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "failed", detail: String(error) };
  }
}
