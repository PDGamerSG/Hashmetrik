import { strict as assert } from "node:assert";
import { after, before, describe, it } from "node:test";
import { decryptSession, encryptSession } from "../lib/auth/session.ts";

const ORIGINAL = process.env.SESSION_SECRET;

before(() => {
  process.env.SESSION_SECRET = "test-secret-please-do-not-use-anywhere-real";
});

after(() => {
  process.env.SESSION_SECRET = ORIGINAL;
});

describe("session", () => {
  it("round trips an admin", async () => {
    const { token } = await encryptSession({ adminId: "adm_1", email: "a@hashmetrik.in" });
    const payload = await decryptSession(token);

    assert.equal(payload?.adminId, "adm_1");
    assert.equal(payload?.email, "a@hashmetrik.in");
  });

  it("rejects a tampered token", async () => {
    const { token } = await encryptSession({ adminId: "adm_1", email: "a@hashmetrik.in" });
    const [header, body, signature] = token.split(".");

    /* Re-encode the payload with a different admin id, keeping the original
       signature — the forgery an attacker would actually try. */
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, "base64url").toString()), adminId: "adm_2" }),
    ).toString("base64url");

    assert.equal(await decryptSession(`${header}.${forged}.${signature}`), null);
  });

  it("rejects a token signed with another secret", async () => {
    const { token } = await encryptSession({ adminId: "adm_1", email: "a@hashmetrik.in" });
    process.env.SESSION_SECRET = "a-different-secret-entirely-rotated-away";
    try {
      assert.equal(await decryptSession(token), null);
    } finally {
      process.env.SESSION_SECRET = "test-secret-please-do-not-use-anywhere-real";
    }
  });

  it("rejects an expired token", async () => {
    const { token } = await encryptSession({ adminId: "adm_1", email: "a@hashmetrik.in" }, -60);
    assert.equal(await decryptSession(token), null);
  });

  it("rejects nonsense and nothing at all", async () => {
    assert.equal(await decryptSession(undefined), null);
    assert.equal(await decryptSession(""), null);
    assert.equal(await decryptSession("not-a-jwt"), null);
  });

  it("refuses to sign without a secret", async () => {
    const saved = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;
    try {
      await assert.rejects(
        () => encryptSession({ adminId: "adm_1", email: "a@hashmetrik.in" }),
        /SESSION_SECRET/,
      );
    } finally {
      process.env.SESSION_SECRET = saved;
    }
  });
});
