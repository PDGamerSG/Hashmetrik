import { SignJWT, jwtVerify } from "jose";

/**
 * The admin session, as a signed cookie.
 *
 * Stateless: the payload travels in the cookie and is verified by signature on
 * each request, so there is no session table and no database round trip on a
 * page that only needs to know who is asking. The trade is that a session
 * cannot be revoked before it expires — acceptable for a handful of staff
 * accounts, and rotating `SESSION_SECRET` invalidates every session at once if
 * it ever isn't.
 *
 * The encrypt/decrypt pair here is deliberately free of `next/headers` so it
 * can be exercised by a plain test; the cookie itself is handled in `cookie.ts`.
 */
export const SESSION_COOKIE = "hm_session";

/** Seven days. Long enough not to nag, short enough that a stale laptop lapses. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionPayload = {
  adminId: string;
  email: string;
  /** Seconds since the epoch, as JWTs count. */
  expiresAt: number;
};

const ALG = "HS256";

function key(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one — see docs/backend-setup.md.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(
  payload: Omit<SessionPayload, "expiresAt">,
  maxAge = SESSION_MAX_AGE,
): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + maxAge * 1000);
  const token = await new SignJWT({ adminId: payload.adminId, email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(key());
  return { token, expiresAt };
}

/**
 * Returns null for anything that isn't a live, correctly signed session —
 * tampered, expired, signed with an old secret, or simply absent. Callers get
 * one answer to check rather than a set of failure modes, and nothing about
 * which of those it was leaks back to the browser.
 */
export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: [ALG] });
    const adminId = payload.adminId;
    const email = payload.email;
    if (typeof adminId !== "string" || typeof email !== "string") return null;
    return { adminId, email, expiresAt: (payload.exp ?? 0) * 1000 };
  } catch {
    return null;
  }
}
