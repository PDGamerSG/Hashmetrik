import { SignJWT, jwtVerify } from "jose";

/**
 * The session, as a signed cookie.
 *
 * Stateless: the payload travels in the cookie and is verified by signature on
 * each request, so there is no session table and no database round trip on a
 * page that only needs to know who is asking. The trade is that a session
 * cannot be revoked before it expires, and that a role or status changed in the
 * database is not felt until the token is reissued — which is why the actions
 * that change either of those reissue it, and why rotating `SESSION_SECRET`
 * exists as the blunt instrument that invalidates every session at once.
 *
 * The encrypt/decrypt pair here is deliberately free of `next/headers` so it
 * can be exercised by a plain test; the cookie itself is handled in `cookie.ts`.
 */
export const SESSION_COOKIE = "hm_session";

/** Seven days. Long enough not to nag, short enough that a stale laptop lapses. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/**
 * Mirrors the `Role` and `UserStatus` enums in `prisma/schema.prisma`.
 *
 * Declared here rather than imported from the generated client because this
 * module is loaded by `proxy.ts`, which should not pull Prisma into the proxy
 * bundle, and by tests that run without a generated client at all.
 */
export const ROLES = ["REGISTERED_USER", "TEAM_MEMBER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const STATUSES = ["NON_CLIENT", "CLIENT"] as const;
export type UserStatus = (typeof STATUSES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
  /** Milliseconds since the epoch. */
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
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    status: payload.status,
  })
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
 *
 * The role and status are checked against the known sets rather than cast. A
 * token carrying a value this build does not recognise reads as no session at
 * all, so an unknown role can never widen access.
 */
export async function decryptSession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: [ALG] });
    const { userId, email, role, status } = payload;
    if (typeof userId !== "string" || typeof email !== "string") return null;
    if (!isRole(role) || !isStatus(status)) return null;
    return { userId, email, role, status, expiresAt: (payload.exp ?? 0) * 1000 };
  } catch {
    return null;
  }
}
