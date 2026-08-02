/**
 * Lead shape, normalisation and validation.
 *
 * Free of `server-only`, Prisma and `next/*` on purpose: this is the part worth
 * testing, and it should be runnable by `node --test` without a request or a
 * database behind it. Anything that touches the database lives in `store.ts`.
 */

export type LeadKind = "booking" | "contact";

export type LeadInput = {
  kind: LeadKind;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: string;
  service?: string;
  budget?: string;
  preferredDate?: string;
  preferredTime?: string;
  message?: string;
};

/**
 * The pipeline, in the order the PRD names it: Lead, Qualified, Consultation,
 * Proposal, Negotiation, Client — plus `lost`, which every pipeline needs and
 * no diagram ever draws.
 *
 * Order matters: the admin CRM board renders these as columns left to right, so
 * the array is the stage sequence and not just a set of allowed values.
 */
export const LEAD_STATUSES = [
  "new",
  "qualified",
  "consultation",
  "proposal",
  "negotiation",
  "client",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** What each stage is called on screen. Lower case reads as a label, not a shout. */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Lead",
  qualified: "Qualified",
  consultation: "Consultation",
  proposal: "Proposal",
  negotiation: "Negotiation",
  client: "Client",
  lost: "Lost",
};

/** The stages a lead is still live in — everything before it converts or dies. */
export const OPEN_LEAD_STATUSES = LEAD_STATUSES.filter(
  (s) => s !== "client" && s !== "lost",
);

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

/** Where a stage sits in the pipeline, or -1 for a value written before a rename. */
export function leadStageIndex(value: string): number {
  return (LEAD_STATUSES as readonly string[]).indexOf(value);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field ceilings, matched to the `maxLength` the forms already enforce. */
const LIMITS = {
  name: 100,
  email: 255,
  phone: 20,
  company: 120,
  website: 200,
  industry: 80,
  service: 80,
  budget: 40,
  preferredDate: 20,
  preferredTime: 20,
  message: 1000,
} as const;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Trims, truncates and pins `kind` to one of the two the site sends.
 *
 * Both callers are server actions, which means the payload is whatever the
 * client chose to post rather than whatever the form rendered — so every field
 * is treated as untrusted regardless of the `maxLength` on the input.
 */
export function normalizeLead(input: Partial<LeadInput>): LeadInput {
  return {
    kind: input.kind === "booking" ? "booking" : "contact",
    name: clean(input.name, LIMITS.name),
    email: clean(input.email, LIMITS.email),
    phone: clean(input.phone, LIMITS.phone),
    company: clean(input.company, LIMITS.company),
    website: clean(input.website, LIMITS.website),
    industry: clean(input.industry, LIMITS.industry),
    service: clean(input.service, LIMITS.service),
    budget: clean(input.budget, LIMITS.budget),
    preferredDate: clean(input.preferredDate, LIMITS.preferredDate),
    preferredTime: clean(input.preferredTime, LIMITS.preferredTime),
    message: clean(input.message, LIMITS.message),
  };
}

/** Returns the message to show the visitor, or null when the lead is good. */
export function validateLead(lead: LeadInput): string | null {
  if (!lead.name) return "Add your name so we know who to reply to.";
  if (!EMAIL.test(lead.email)) return "That email address looks incomplete.";
  if (lead.kind === "booking" && !lead.phone) {
    return "Add a phone number — the call is easier to confirm that way.";
  }
  return null;
}
