"use server";

/**
 * Lead capture.
 *
 * Validation and the server boundary are done. Persistence is the one thing
 * left to wire: drop your store or transactional-email call into `deliver`
 * below and both the booking flow and the contact form start recording.
 */

export type LeadKind = "booking" | "contact";

export type Lead = {
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

export type LeadResult = { ok: true } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function deliver(lead: Lead) {
  // TODO: persist the lead and notify the team, e.g. write to your database
  // and send a transactional email to info@hashmetrik.in.
  console.info("[lead]", lead.kind, lead.email);
}

export async function submitLead(input: Lead): Promise<LeadResult> {
  const lead: Lead = {
    kind: input.kind === "booking" ? "booking" : "contact",
    name: clean(input.name, 100),
    email: clean(input.email, 255),
    phone: clean(input.phone, 20),
    company: clean(input.company, 120),
    website: clean(input.website, 200),
    industry: clean(input.industry, 80),
    service: clean(input.service, 80),
    budget: clean(input.budget, 40),
    preferredDate: clean(input.preferredDate, 20),
    preferredTime: clean(input.preferredTime, 20),
    message: clean(input.message, 1000),
  };

  if (!lead.name) return { ok: false, error: "Add your name so we know who to reply to." };
  if (!EMAIL.test(lead.email)) return { ok: false, error: "That email address looks incomplete." };
  if (lead.kind === "booking" && !lead.phone) {
    return { ok: false, error: "Add a phone number — the call is easier to confirm that way." };
  }

  try {
    await deliver(lead);
    return { ok: true };
  } catch {
    return { ok: false, error: "That didn't send. Try again, or email info@hashmetrik.in." };
  }
}
