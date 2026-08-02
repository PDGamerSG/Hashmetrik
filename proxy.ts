import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/auth/session";
import { gate } from "@/lib/auth/gate";

/**
 * Next 16 renamed `middleware` to `proxy`. This one routes: it sends a visitor
 * without a live session to the login page, and a signed-in visitor who has
 * wandered into someone else's area back to their own, before either page
 * renders.
 *
 * It is not the security boundary — `verifySession()` and the `require*`
 * helpers in `lib/auth/dal.ts` are, because a server action is its own endpoint
 * and never passes through here. What this does have to get right is the
 * redirect, and presence of a cookie is not enough to decide it: a token signed
 * with a rotated `SESSION_SECRET`, expired, or forged would be waved through,
 * bounced back by the data access layer, and waved through again. Rotating the
 * secret is the documented way to revoke every session, so a redirect loop
 * there is an ordinary path, not a hostile one.
 *
 * Verifying the signature is what makes the two ends agree, and `jose` needs
 * nothing but the secret — no database, which proxy code cannot rely on
 * reaching. The policy itself lives in `lib/auth/gate.ts` so it can be tested
 * without a request.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  /* Null for anything that isn't live and correctly signed — including a
     missing `SESSION_SECRET`, which `decryptSession` swallows rather than
     throwing, so a misconfigured deploy reads as signed out. */
  const session = await decryptSession(token);

  const { redirectTo, clearCookie } = gate({
    pathname: request.nextUrl.pathname,
    hasToken: Boolean(token),
    viewer: session && { role: session.role, status: session.status },
  });

  const response = redirectTo
    ? NextResponse.redirect(new URL(redirectTo, request.url))
    : NextResponse.next({ request: { headers: withPathname(request) } });

  /* So the browser stops sending a token that will never verify again. */
  if (clearCookie) response.cookies.delete(SESSION_COOKIE);

  return response;
}

/**
 * Passes the path through as a header.
 *
 * A layout cannot see the URL it is rendering — `useSearchParams` is client
 * side and `params` only reaches pages — so the dashboard nav has no way to
 * know which link to mark as current. One header, set where the request is
 * already being inspected, is cheaper than turning the nav into a client
 * component to read `usePathname`.
 */
function withPathname(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return headers;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/team",
    "/team/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
};
