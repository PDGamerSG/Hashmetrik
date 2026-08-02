import type { Role, UserStatus } from "./session";

/**
 * Which areas need a session, and where to send a request that hasn't got one.
 *
 * Split out of `proxy.ts` so the policy can be read in one place and exercised
 * by a plain test: that file has to import `next/server`, and the part worth
 * testing is this table rather than the redirect plumbing around it.
 *
 * Note what this deliberately does *not* do: decide whether a signed-in visitor
 * may enter. The session token carries a role and a status, but they were true
 * when it was issued and an admin can change either at any moment — activating
 * a client, promoting a team member. Authorising on that would mean a newly
 * activated client is turned away from their own dashboard until they sign out
 * and back in. So the proxy answers "is anyone there?" and the data access
 * layer, next to the database, answers "may they?" against the live row.
 */

/** Just enough of a session to name someone's home. */
export type Viewer = { role: Role; status: UserStatus };

export type GateDecision = {
  /** Where to send the request, or null to let it through. */
  redirectTo: string | null;
  /** Whether the session cookie should be removed from the response. */
  clearCookie: boolean;
};

/** The pages that exist to get you a session; nobody signed in needs them. */
const AUTH_PATHS = new Set(["/login", "/signup", "/admin/login"]);

/** The areas that need one. */
const GATED = ["/admin", "/team", "/dashboard"];

/**
 * Where someone belongs when they land somewhere they don't.
 *
 * Sending a signed-in visitor to their own home rather than to the login page
 * matters: a team member who follows an `/admin` link is not signed out, they
 * are in the wrong place, and answering that with a login form they cannot
 * satisfy is both a lie and a redirect loop waiting to happen.
 */
export function homeFor(viewer: Viewer): string {
  if (viewer.role === "ADMIN") return "/admin";
  if (viewer.role === "TEAM_MEMBER") return "/team";
  return "/dashboard";
}

function isGated(pathname: string): boolean {
  return GATED.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

/** The admin area keeps its own login page; it is linked from nowhere and says so. */
function loginFor(pathname: string): string {
  return pathname === "/admin" || pathname.startsWith("/admin/") ? "/admin/login" : "/login";
}

export function gate(input: {
  pathname: string;
  hasToken: boolean;
  viewer: Viewer | null;
}): GateDecision {
  const { pathname, hasToken, viewer } = input;

  /* A cookie that is present but does not verify — rotated `SESSION_SECRET`,
     expired, forged. It has to read as signed out at both ends: treating it as
     signed in here sends the visitor to a page the data access layer bounces
     them straight back from, forever. The dead cookie is cleared on the way. */
  const stale = hasToken && !viewer;

  if (AUTH_PATHS.has(pathname)) {
    if (viewer) return { redirectTo: homeFor(viewer), clearCookie: false };
    return { redirectTo: null, clearCookie: stale };
  }

  if (isGated(pathname) && !viewer) {
    return { redirectTo: loginFor(pathname), clearCookie: stale };
  }

  return { redirectTo: null, clearCookie: stale };
}
