import "server-only";

import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  decryptSession,
  encryptSession,
  type SessionPayload,
} from "./session";

/**
 * The cookie side of the session, kept apart from the signing so the crypto can
 * be tested without a request context.
 *
 * `httpOnly` keeps the token away from any script on the page, `sameSite=lax`
 * stops another origin from posting to an admin action with the cookie
 * attached, and `secure` is dropped in development because localhost is http.
 */
export async function createSession(adminId: string, email: string): Promise<void> {
  const { token, expiresAt } = await encryptSession({ adminId, email });
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
