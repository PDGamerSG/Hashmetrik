import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { SHEET_HEADER, SHEET_LAST_COLUMN, leadToRow } from "../lib/sheets/schema.ts";
import { normalizeLead } from "../lib/leads/schema.ts";

const AT = new Date("2026-08-18T09:30:00.000Z");

describe("leadToRow", () => {
  it("sends exactly as many cells as the header has columns", () => {
    /* Sheets pads a short row with blanks at the end, so a row one cell short is
       not an error anywhere — it is a column of values silently filed under the
       wrong heading from that point on. */
    const row = leadToRow(
      normalizeLead({ kind: "booking", name: "Asha Rao", email: "asha@example.com" }),
      AT,
    );
    assert.equal(row.length, SHEET_HEADER.length);
  });

  it("puts every value under the heading that names it", () => {
    const row = leadToRow(
      normalizeLead({
        kind: "booking",
        name: "Asha Rao",
        email: "asha@example.com",
        phone: "9505070701",
        company: "Rao Interiors",
        service: "SEO",
        budget: "1-2L",
        preferredDate: "2026-08-24",
        preferredTime: "11:00",
        message: "Wednesday suits better.",
      }),
      AT,
    );

    const cell = (heading: (typeof SHEET_HEADER)[number]) => row[SHEET_HEADER.indexOf(heading)];

    assert.equal(cell("Submitted"), "2026-08-18T09:30:00.000Z");
    assert.equal(cell("Kind"), "Booking");
    assert.equal(cell("Name"), "Asha Rao");
    assert.equal(cell("Email"), "asha@example.com");
    assert.equal(cell("Phone"), "9505070701");
    assert.equal(cell("Company"), "Rao Interiors");
    assert.equal(cell("Service"), "SEO");
    assert.equal(cell("Budget"), "1-2L");
    assert.equal(cell("Preferred date"), "2026-08-24");
    assert.equal(cell("Preferred time"), "11:00");
    assert.equal(cell("Message"), "Wednesday suits better.");
  });

  it("writes an unfilled field as a blank cell rather than leaving it out", () => {
    const row = leadToRow(
      normalizeLead({ kind: "contact", name: "Asha Rao", email: "asha@example.com" }),
      AT,
    );

    /* Every gap has to hold its place. Omitting one would shift each column
       after it a cell to the left. */
    assert.equal(row.length, SHEET_HEADER.length);
    assert.equal(row[SHEET_HEADER.indexOf("Company")], "");
    assert.equal(row[SHEET_HEADER.indexOf("Message")], "");
    assert.ok(row.every((value) => typeof value === "string"));
  });

  it("distinguishes the two kinds, because the sheet holds both", () => {
    const kind = (input: Parameters<typeof normalizeLead>[0]) =>
      leadToRow(normalizeLead(input), AT)[SHEET_HEADER.indexOf("Kind")];

    assert.equal(kind({ kind: "booking", name: "A", email: "a@b.co" }), "Booking");
    assert.equal(kind({ kind: "contact", name: "A", email: "a@b.co" }), "Contact");
  });
});

describe("SHEET_LAST_COLUMN", () => {
  it("names the column the header actually ends at", () => {
    /* The append range is built from this. If the two disagree, Sheets accepts
       the write and truncates the row without complaining. */
    assert.equal(SHEET_LAST_COLUMN, String.fromCharCode(64 + SHEET_HEADER.length));
    assert.equal(SHEET_LAST_COLUMN, "M");
  });
});
