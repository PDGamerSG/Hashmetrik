import type { LeadInput } from "@/lib/leads/schema";

/**
 * Transactional email over SMTP, via nodemailer.
 *
 * Kept free of `server-only` so the message builder below can be tested
 * directly, and nodemailer itself is imported lazily inside the sender so that
 * `node --test` never loads it to check a string.
 *
 * Gmail rewrites `From:` to whichever account authenticated, so `LEAD_FROM_EMAIL`
 * is only honoured on a host that permits it — the default matches the account
 * rather than pretending otherwise.
 */
const DEFAULT_FROM = "HashMetrik <hashmetrik@gmail.com>";
const DEFAULT_TO = "hashmetrik@gmail.com";

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
 * Never throws. The lead is already saved by the time this runs, so missing
 * credentials or a refused connection is a degraded notification, not a failed
 * submission — the caller records that and moves on.
 */
export async function sendLeadNotification(
  lead: LeadInput,
  wording: LeadEmailWording = {},
): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return { ok: false, reason: "unconfigured" };

  const { subject, text } = buildLeadEmail(lead, wording);

  try {
    /* Lazily, and inside the try: this module is imported by `tests/email.ts`
       for `buildLeadEmail` alone, and a top-level import would drag nodemailer's
       CommonJS tree into a test that never sends anything. */
    const { createTransport } = await import("nodemailer");

    /* 465 is implicit TLS and 587 is STARTTLS, which is the whole difference —
       deriving `secure` from the port removes a second variable that can only
       ever be set wrong. */
    const port = Number(process.env.SMTP_PORT) || 465;

    /* A transport per send rather than a pooled module-level one. These run on
       serverless invocations that are frozen between requests, where a pooled
       socket is a connection the far end closed while nobody was looking. */
    const transport = createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 8_000,
    });

    await transport.sendMail({
      from: process.env.LEAD_FROM_EMAIL || DEFAULT_FROM,
      to: process.env.LEAD_NOTIFY_EMAIL || DEFAULT_TO,
      /* So hitting reply in the inbox answers the person who wrote in. */
      replyTo: lead.email,
      subject,
      text,
    });

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "failed", detail: String(error) };
  }
}
