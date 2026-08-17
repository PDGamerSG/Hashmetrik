/**
 * The row a lead becomes in the spreadsheet.
 *
 * Free of `server-only`, Prisma and `next/*` on purpose: the column order is the
 * part worth testing, and drift between the header and the row is the failure
 * that matters — a sheet filing phone numbers under "Company" is worse than no
 * sheet at all. Anything that talks to Google lives in `store.ts`.
 */

import type { LeadInput } from "@/lib/leads/schema";

/**
 * The columns, in order. `SHEET_RANGE` is derived from the length rather than
 * written out, so adding a column cannot leave the append writing into a range
 * one narrower than the row it is sending.
 */
export const SHEET_HEADER = [
  "Submitted",
  "Kind",
  "Name",
  "Email",
  "Phone",
  "Company",
  "Website",
  "Industry",
  "Service",
  "Budget",
  "Preferred date",
  "Preferred time",
  "Message",
] as const;

/** "A" through the last column the header occupies — "M" while there are 13. */
export const SHEET_LAST_COLUMN = String.fromCharCode(64 + SHEET_HEADER.length);

/** What each kind is called in the sheet. Shorter than the email's wording: a column, not a subject line. */
const KIND_LABELS: Record<LeadInput["kind"], string> = {
  booking: "Booking",
  contact: "Contact",
};

/**
 * One lead, flattened in `SHEET_HEADER` order.
 *
 * The timestamp is ISO 8601 UTC rather than anything friendlier. A sheet is
 * sorted and filtered far more often than it is read top to bottom, and ISO is
 * the one format that sorts correctly as plain text — which is what these values
 * stay, because the append sends them RAW. See `store.ts` for why that matters.
 *
 * Missing optional fields become empty strings, never `undefined`: Sheets pads a
 * short row with blanks at the *end*, so a row that omits a value mid-way would
 * shift every column after it one to the left.
 */
export function leadToRow(lead: LeadInput, submittedAt: Date = new Date()): string[] {
  return [
    submittedAt.toISOString(),
    KIND_LABELS[lead.kind],
    lead.name,
    lead.email,
    lead.phone ?? "",
    lead.company ?? "",
    lead.website ?? "",
    lead.industry ?? "",
    lead.service ?? "",
    lead.budget ?? "",
    lead.preferredDate ?? "",
    lead.preferredTime ?? "",
    lead.message ?? "",
  ];
}
