import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

/**
 * Next 16 renamed `middleware` to `proxy`. This one does a single, deliberately
 * shallow job: send a visitor with no session cookie to the login page before
 * the dashboard renders.
 *
 * It does not verify the signature and it is not the security boundary — a
 * forged cookie gets past this and is then rejected by `verifySession()` in the
 * data access layer, which is where authorisation actually lives. Keeping the
 * check to cookie presence also keeps this file free of anything that has to
 * reach the database, which proxy code cannot rely on.
 */
export function proxy(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login") {
    /* Already signed in? Skip the form. */
    if (hasCookie) return NextResponse.redirect(new URL("/admin", request.url));
    return NextResponse.next();
  }

  if (!hasCookie) return NextResponse.redirect(new URL("/admin/login", request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
