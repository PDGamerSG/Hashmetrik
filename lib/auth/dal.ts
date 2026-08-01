import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./cookie";
import type { SessionPayload } from "./session";

/**
 * The data access layer's front door.
 *
 * Every admin page and every admin server action calls this itself. `proxy.ts`
 * also bounces anyone without a cookie, but that check is optimistic by design
 * — Next.js documents proxy as a place for redirects, not for authorisation,
 * and a request that reaches a server action never passed through it at all.
 * So the boundary is here, next to the data.
 *
 * `cache()` dedupes it within a single render: a layout and three components
 * can each ask who is signed in and the cookie is verified once.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await readSession();
  if (!session) redirect("/admin/login");
  return session;
});

/** Same check without the redirect, for code that wants to branch instead. */
export const optionalSession = cache(async (): Promise<SessionPayload | null> => {
  return readSession();
});
