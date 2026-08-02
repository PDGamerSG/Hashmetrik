import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  MAX_PASSWORD,
  MIN_PASSWORD,
  normalizeEmail,
  normalizeSignup,
  validatePassword,
  validateSignup,
} from "../lib/accounts/schema.ts";

describe("normalizeEmail", () => {
  it("lower cases and trims, so one person is one account", () => {
    assert.equal(normalizeEmail("  Someone@HashMetrik.IN "), "someone@hashmetrik.in");
  });

  it("returns an empty string for anything that isn't one", () => {
    assert.equal(normalizeEmail(undefined), "");
    assert.equal(normalizeEmail(42), "");
    assert.equal(normalizeEmail(null), "");
  });
});

describe("normalizeSignup", () => {
  it("trims the fields around the password", () => {
    const input = normalizeSignup({ name: "  Asha  ", businessName: " Ventures " });
    assert.equal(input.name, "Asha");
    assert.equal(input.businessName, "Ventures");
  });

  /* Trimming a password silently sets one the user did not type, and they find
     out at the next sign-in. */
  it("leaves the password exactly as typed", () => {
    assert.equal(normalizeSignup({ password: "  spaces both ends  " }).password, "  spaces both ends  ");
  });

  it("truncates rather than rejecting an over-long field", () => {
    assert.equal(normalizeSignup({ name: "a".repeat(500) }).name.length, 100);
  });
});

describe("validatePassword", () => {
  it("wants length and nothing else", () => {
    assert.equal(validatePassword("a".repeat(MIN_PASSWORD)), null);
    assert.equal(validatePassword("correct horse battery staple"), null);
  });

  it("refuses anything shorter", () => {
    assert.match(validatePassword("a".repeat(MIN_PASSWORD - 1)) ?? "", /at least/);
  });

  /* bcrypt truncates at 72 bytes, and a password that is quietly not the one
     that was typed is worse than one that was refused. */
  it("refuses more than bcrypt can hold", () => {
    assert.equal(validatePassword("a".repeat(MAX_PASSWORD)), null);
    assert.match(validatePassword("a".repeat(MAX_PASSWORD + 1)) ?? "", /longer than/);
  });

  it("counts bytes, not characters", () => {
    /* Each emoji is four bytes, so 20 of them are 80 — over the limit while
       being only 20 characters long. */
    assert.match(validatePassword("😀".repeat(20)) ?? "", /longer than/);
  });
});

describe("validateSignup", () => {
  const good = {
    name: "Asha",
    email: "asha@example.com",
    password: "a-long-enough-passphrase",
  };

  it("accepts a complete signup", () => {
    assert.equal(validateSignup(good), null);
  });

  it("asks for a name", () => {
    assert.match(validateSignup({ ...good, name: "" }) ?? "", /name/i);
  });

  it("rejects an address that is not one", () => {
    for (const email of ["asha", "asha@", "@example.com", "asha@example", "a b@example.com"]) {
      assert.notEqual(validateSignup({ ...good, email }), null, email);
    }
  });

  it("checks the password too", () => {
    assert.match(validateSignup({ ...good, password: "short" }) ?? "", /at least/);
  });
});
