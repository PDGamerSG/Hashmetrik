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

const ADMIN = {
  userId: "usr_1",
  email: "a@hashmetrik.in",
  role: "ADMIN",
  status: "NON_CLIENT",
} as const;

/** Re-encodes the payload with `patch` applied, keeping the original signature. */
function forge(token: string, patch: Record<string, unknown>): string {
  const [header, body, signature] = token.split(".");
  const claims = JSON.parse(Buffer.from(body, "base64url").toString());
  const forged = Buffer.from(JSON.stringify({ ...claims, ...patch })).toString("base64url");
  return `${header}.${forged}.${signature}`;
}

describe("session", () => {
  it("round trips a user", async () => {
    const { token } = await encryptSession(ADMIN);
    const payload = await decryptSession(token);

    assert.equal(payload?.userId, "usr_1");
    assert.equal(payload?.email, "a@hashmetrik.in");
    assert.equal(payload?.role, "ADMIN");
    assert.equal(payload?.status, "NON_CLIENT");
  });

  it("rejects a tampered token", async () => {
    const { token } = await encryptSession(ADMIN);
    assert.equal(await decryptSession(forge(token, { userId: "usr_2" })), null);
  });

  /* The forgery worth naming: not a different account, a bigger one. */
  it("rejects a token whose role has been edited", async () => {
    const { token } = await encryptSession({ ...ADMIN, role: "REGISTERED_USER" });
    assert.equal(await decryptSession(forge(token, { role: "ADMIN" })), null);
  });

  it("rejects a role or status it does not recognise", async () => {
    const { token } = await encryptSession({
      ...ADMIN,
      /* Signed correctly, so only the value check can catch it — what a token
         from a future build carrying a role this one has never heard of would
         look like. */
      role: "SUPERUSER" as unknown as typeof ADMIN.role,
    });
    assert.equal(await decryptSession(token), null);
  });

  it("rejects a token signed with another secret", async () => {
    const { token } = await encryptSession(ADMIN);
    process.env.SESSION_SECRET = "a-different-secret-entirely-rotated-away";
    try {
      assert.equal(await decryptSession(token), null);
    } finally {
      process.env.SESSION_SECRET = "test-secret-please-do-not-use-anywhere-real";
    }
  });

  it("rejects an expired token", async () => {
    const { token } = await encryptSession(ADMIN, -60);
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
      await assert.rejects(() => encryptSession(ADMIN), /SESSION_SECRET/);
    } finally {
      process.env.SESSION_SECRET = saved;
    }
  });
});
