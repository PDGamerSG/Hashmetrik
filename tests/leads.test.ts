import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  isLeadStatus,
  normalizeLead,
  validateLead,
  type LeadInput,
} from "../lib/leads/schema.ts";

function booking(over: Partial<LeadInput> = {}): LeadInput {
  return normalizeLead({
    kind: "booking",
    name: "Asha Rao",
    email: "asha@example.com",
    phone: "9505070701",
    ...over,
  });
}

describe("normalizeLead", () => {
  it("trims whitespace", () => {
    assert.equal(normalizeLead({ name: "  Asha  " }).name, "Asha");
  });

  it("truncates a field past its ceiling", () => {
    const lead = normalizeLead({ message: "x".repeat(2000) });
    assert.equal(lead.message?.length, 1000);
  });

  it("falls back to contact for any kind the site does not send", () => {
    assert.equal(normalizeLead({ kind: "admin" as never }).kind, "contact");
    assert.equal(normalizeLead({}).kind, "contact");
    assert.equal(normalizeLead({ kind: "booking" }).kind, "booking");
  });

  it("turns non-strings into empty strings rather than passing them through", () => {
    /* The payload is whatever a client posts to the server action, not what the
       form rendered — so a number, an object or null must not reach the row. */
    const lead = normalizeLead({ name: 42 as never, email: null as never });
    assert.equal(lead.name, "");
    assert.equal(lead.email, "");
  });
});

describe("validateLead", () => {
  it("accepts a complete booking", () => {
    assert.equal(validateLead(booking()), null);
  });

  it("rejects a missing name", () => {
    assert.match(String(validateLead(booking({ name: "   " }))), /name/i);
  });

  it("rejects an incomplete email", () => {
    for (const email of ["asha", "asha@", "asha@example", "@example.com", "a b@c.com"]) {
      assert.notEqual(validateLead(booking({ email })), null, `accepted ${email}`);
    }
  });

  it("requires a phone number on a booking but not on a contact", () => {
    assert.match(String(validateLead(booking({ phone: "" }))), /phone/i);
    assert.equal(
      validateLead(normalizeLead({ kind: "contact", name: "Asha", email: "a@b.com" })),
      null,
    );
  });
});

describe("isLeadStatus", () => {
  it("accepts the four stages and nothing else", () => {
    for (const status of ["new", "contacted", "qualified", "closed"]) {
      assert.equal(isLeadStatus(status), true);
    }
    for (const status of ["NEW", "won", "", null, 3, undefined]) {
      assert.equal(isLeadStatus(status), false);
    }
  });
});
