import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { buildLeadEmail } from "../lib/email.ts";
import { normalizeLead } from "../lib/leads/schema.ts";

describe("buildLeadEmail", () => {
  it("names the source in the subject so the inbox can be sorted at a glance", () => {
    const booking = buildLeadEmail(
      normalizeLead({ kind: "booking", name: "Asha Rao", email: "asha@example.com" }),
    );
    assert.equal(booking.subject, "Booking request — Asha Rao");

    const contact = buildLeadEmail(
      normalizeLead({ kind: "contact", name: "Asha Rao", email: "asha@example.com" }),
    );
    assert.equal(contact.subject, "Contact form — Asha Rao");
  });

  it("takes the subject prefix and opening line an admin configured", () => {
    const { subject, text } = buildLeadEmail(
      normalizeLead({ kind: "booking", name: "Asha Rao", email: "asha@example.com" }),
      { subjectPrefix: "New enquiry", intro: "Someone wants a call." },
    );
    assert.equal(subject, "New enquiry — Asha Rao");
    assert.match(text, /^Someone wants a call\./);
  });

  it("falls back to naming the source when the setting is blank or whitespace", () => {
    /* A setting saved as an empty string is the ordinary state — nobody has
       edited it — and it must not produce a subject that is just a dash. */
    const { subject, text } = buildLeadEmail(
      normalizeLead({ kind: "contact", name: "Asha Rao", email: "asha@example.com" }),
      { subjectPrefix: "   ", intro: "" },
    );
    assert.equal(subject, "Contact form — Asha Rao");
    assert.match(text, /^Contact form from hashmetrik\.com/);
  });

  it("lists only the fields that were filled in", () => {
    const { text } = buildLeadEmail(
      normalizeLead({
        kind: "booking",
        name: "Asha Rao",
        email: "asha@example.com",
        phone: "9505070701",
        service: "SEO",
      }),
    );

    assert.match(text, /Name: Asha Rao/);
    assert.match(text, /Phone: 9505070701/);
    assert.match(text, /Service: SEO/);
    /* An empty field would otherwise print as a bare label, and a mail full of
       "Budget:" with nothing after it is harder to read than one without. */
    assert.doesNotMatch(text, /Budget:/);
    assert.doesNotMatch(text, /Message:/);
  });
});
