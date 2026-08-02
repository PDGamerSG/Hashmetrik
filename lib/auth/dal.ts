import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { readSession } from "./cookie";
import { homeFor } from "./gate";
import type { Role, SessionPayload, UserStatus } from "./session";

/**
 * The data access layer's front door, and the place authorisation actually
 * happens.
 *
 * Every gated page and every gated server action calls one of these itself.
 * `proxy.ts` also bounces requests with no session, but that is a routing
 * convenience — Next.js documents proxy as a place for redirects, not for
 * authorisation, and a request that reaches a server action never passed
 * through it at all.
 *
 * The role and status come from the database rather than from the token. The
 * token says what was true when it was signed, and an admin activating a client
 * or promoting a team member changes the answer immediately; reading the live
 * row means that takes effect on the next page load rather than the next login,
 * and means a session cannot outlive the access it was granted. `cache()` makes
 * it one query per request no matter how many components ask.
 */

export type Viewer = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  name: string | null;
};

/** Identity only, straight from the cookie. No database. */
export const optionalSession = cache(async (): Promise<SessionPayload | null> => {
  return readSession();
});

/** The signed-in user as the database currently has them, or null. */
export const currentViewer = cache(async (): Promise<Viewer | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, role: true, status: true, name: true },
  });

  /* A valid token for an account that no longer exists. Deleting a user is
     meant to end their access, and the signature alone cannot express that. */
  return user ?? null;
});

/** Signed in, any role. */
export const verifySession = cache(async (): Promise<Viewer> => {
  const viewer = await currentViewer();
  if (!viewer) redirect("/login");
  return viewer;
});

/**
 * Signed in as an administrator.
 *
 * Sends anyone else to their own home rather than to the login form: they have
 * a perfectly good session, it is simply not one that opens this door, and a
 * login page they cannot satisfy would be both a lie and a loop.
 */
export const requireAdmin = cache(async (): Promise<Viewer> => {
  const viewer = await currentViewer();
  if (!viewer) redirect("/admin/login");
  if (viewer.role !== "ADMIN") redirect(homeFor(viewer));
  return viewer;
});

/** Signed in as staff. Administrators count — they can do anything a team member can. */
export const requireStaff = cache(async (): Promise<Viewer> => {
  const viewer = await currentViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "TEAM_MEMBER" && viewer.role !== "ADMIN") redirect(homeFor(viewer));
  return viewer;
});

/**
 * Signed in as staff, with the `TeamMember` row when there is one.
 *
 * An administrator has no team row unless somebody made one, so this returns
 * null for them rather than redirecting; admin surfaces that need a team id ask
 * for it explicitly.
 */
export const requireTeamMember = cache(async () => {
  const viewer = await requireStaff();
  const member = await prisma.teamMember.findUnique({
    where: { userId: viewer.id },
    select: { id: true, roleTitle: true },
  });
  return { viewer, member };
});

/**
 * Signed in as a client, with the client row loaded.
 *
 * The row is what callers actually need — every client query is scoped by
 * `clientId`, and looking it up here once means no page has to remember to do
 * it, and none of them can accidentally scope a query by user id instead.
 *
 * Authorisation is the existence of that row, not the status column: the two
 * are set together when an admin activates someone, and the row is the one that
 * the rest of the queries actually hang off. A status of CLIENT with no row is
 * a half-finished activation, and the honest answer to it is the ordinary
 * dashboard, which explains where things stand.
 *
 * Staff are deliberately not admitted here. They read a client's data through
 * the team and admin surfaces, which take the client id as a parameter; letting
 * them in would mean every client query had to ask whose data it was twice.
 */
export const requireClient = cache(async () => {
  const viewer = await currentViewer();
  if (!viewer) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: viewer.id },
    select: { id: true, companyName: true, accountManagerId: true, onboardedAt: true },
  });
  if (!client) redirect("/dashboard");

  return { viewer, client };
});
