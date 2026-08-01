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
