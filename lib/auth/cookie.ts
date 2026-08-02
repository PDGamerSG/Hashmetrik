import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  decryptSession,
  encryptSession,
  type Role,
  type SessionPayload,
  type UserStatus,
} from "./session";

/**
 * The cookie side of the session, kept apart from the signing so the crypto can
 * be tested without a request context.
 *
 * `httpOnly` keeps the token away from any script on the page, `sameSite=lax`
 * stops another origin from posting to a gated action with the cookie
 * attached, and `secure` is dropped in development because localhost is http.
 *
 * The role and status are baked into the token, so anything that changes either
 * has to call this again — see `reissueSession` — or the change is not felt
 * until the session expires.
 */
export async function createSession(user: {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}): Promise<void> {
  const { token, expiresAt } = await encryptSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return decryptSession(jar.get(SESSION_COOKIE)?.value);
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
