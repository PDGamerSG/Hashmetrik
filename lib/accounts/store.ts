import "server-only";

import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { Role, UserStatus } from "@/lib/auth/session";
import type { SignupInput } from "./schema";

function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** The columns a session needs. Never select `passwordHash` into anything else. */
const IDENTITY = { id: true, email: true, role: true, status: true, name: true } as const;

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: { ...IDENTITY, passwordHash: true },
  });
}

/**
 * Creates a registered, non-client account.
 *
 * Role and status are not parameters: this is the public path, and a signup
 * route that can be asked which role to create is one form field away from
 * making administrators. Staff accounts are made by `createAccount`, which is
 * only reachable from an admin action.
 */
export async function createRegisteredUser(input: SignupInput) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: "REGISTERED_USER",
      status: "NON_CLIENT",
      name: input.name,
      phone: orNull(input.phone),
      businessName: orNull(input.businessName),
      businessType: orNull(input.businessType),
    },
    select: IDENTITY,
  });
}

export async function setPassword(userId: string, password: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
    select: { id: true },
  });
}

export async function updateProfile(
  userId: string,
  profile: { name?: string; phone?: string; businessName?: string; businessType?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(profile.name !== undefined ? { name: profile.name } : {}),
      ...(profile.phone !== undefined ? { phone: orNull(profile.phone) } : {}),
      ...(profile.businessName !== undefined
        ? { businessName: orNull(profile.businessName) }
        : {}),
      ...(profile.businessType !== undefined
        ? { businessType: orNull(profile.businessType) }
        : {}),
    },
    select: IDENTITY,
  });
}

export async function setStatus(userId: string, status: UserStatus) {
  return prisma.user.update({ where: { id: userId }, data: { status }, select: IDENTITY });
}

export async function listUsers(filter: { role?: Role; status?: UserStatus } = {}) {
  return prisma.user.findMany({
    where: {
      ...(filter.role ? { role: filter.role } : {}),
      ...(filter.status ? { status: filter.status } : {}),
    },
    select: {
      ...IDENTITY,
      phone: true,
      businessName: true,
      businessType: true,
      createdAt: true,
      clientProfile: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

// ---------------------------------------------------------------------------
// Administration
//
// Everything below is reachable only from `app/(admin)/admin/actions.ts`, which
// calls `requireAdmin()` first. None of it is exported to a client component.
// ---------------------------------------------------------------------------

/** The columns the accounts screen shows. Still never `passwordHash`. */
const DIRECTORY = {
  ...IDENTITY,
  phone: true,
  businessName: true,
  businessType: true,
  suspendedAt: true,
  createdAt: true,
  clientProfile: { select: { id: true, companyName: true, onboardedAt: true } },
  teamProfile: { select: { id: true, roleTitle: true, _count: { select: { managedClients: true } } } },
} as const;

export type DirectoryUser = Awaited<ReturnType<typeof listDirectory>>[number];

/**
 * Every account, filtered the way the accounts screen filters them.
 *
 * One query with optional clauses rather than a page per role: an administrator
 * looking for a person does not know, and should not have to know, which of four
 * tabs that person is filed under. `q` is the escape hatch for exactly that —
 * it searches the three things somebody actually remembers.
 *
 * `mode: "insensitive"` on Postgres compiles to ILIKE, which will not use a
 * plain btree index. At a few hundred accounts that is not worth an index; the
 * `take` is what keeps the page bounded either way.
 */
export async function listDirectory(
  filter: {
    roles?: Role[];
    status?: UserStatus;
    suspended?: boolean;
    q?: string;
  } = {},
) {
  const q = filter.q?.trim();

  return prisma.user.findMany({
    where: {
      ...(filter.roles?.length ? { role: { in: filter.roles } } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.suspended === true ? { suspendedAt: { not: null } } : {}),
      ...(filter.suspended === false ? { suspendedAt: null } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
              { businessName: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    select: DIRECTORY,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

/** One account, for the actions that have to know what they are changing. */
export async function findUser(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: DIRECTORY });
}

/**
 * The tallies above the directory.
 *
 * Grouped in the database rather than counted from the list, because the list is
 * capped at 200 and a count that disagrees with itself once the agency passes
 * that mark is worse than no count at all.
 */
export async function countAccounts() {
  const [byRole, clients, suspended] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.count({ where: { status: "CLIENT" } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
  ]);

  const roles = Object.fromEntries(byRole.map((row) => [row.role, row._count._all])) as Record<
    Role,
    number | undefined
  >;

  return {
    total: byRole.reduce((sum, row) => sum + row._count._all, 0),
    registered: roles.REGISTERED_USER ?? 0,
    team: roles.TEAM_MEMBER ?? 0,
    admins: roles.ADMIN ?? 0,
    clients,
    suspended,
  };
}

/** How many administrators could still sign in if this one could not. */
export async function countOtherActiveAdmins(exceptUserId: string): Promise<number> {
  return prisma.user.count({
    where: { role: "ADMIN", suspendedAt: null, id: { not: exceptUserId } },
  });
}

/**
 * Suspends or restores an account.
 *
 * The timestamp is the state — a boolean would say that access is closed but not
 * when it closed, which is the first thing anybody asks afterwards.
 */
export async function setSuspended(userId: string, suspended: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: { suspendedAt: suspended ? new Date() : null },
    select: { ...IDENTITY, suspendedAt: true },
  });
}

/**
 * Moves an account between roles.
 *
 * Promoting to `TEAM_MEMBER` creates the profile row that the team surfaces hang
 * off, because a team member without one is invisible to every "assign a person"
 * control in the product. Demoting does *not* delete it: `Client.accountManagerId`
 * is `onDelete: SetNull`, so dropping the row would quietly un-assign every
 * account that person looked after, and a role change should not lose that. The
 * role is what authorisation reads; the orphan row is inert.
 */
export async function setRole(userId: string, role: Role) {
  return prisma.$transaction(async (tx) => {
    if (role === "TEAM_MEMBER") {
      const existing = await tx.teamMember.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!existing) await tx.teamMember.create({ data: { userId } });
    }

    return tx.user.update({ where: { id: userId }, data: { role }, select: IDENTITY });
  });
}

/**
 * An admin editing somebody else's details.
 *
 * Separate from `updateProfile` even though the columns overlap: that one is the
 * self-service path and takes the id from the session, this one takes it from a
 * form, and collapsing the two would leave a single function where forgetting an
 * argument means editing the wrong person.
 */
export async function adminUpdateUser(
  userId: string,
  profile: { name: string; phone: string; businessName: string; businessType: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.name,
      phone: orNull(profile.phone),
      businessName: orNull(profile.businessName),
      businessType: orNull(profile.businessType),
    },
    select: IDENTITY,
  });
}

/**
 * An account created from the admin side, in any role.
 *
 * `createRegisteredUser` stays the public path and stays unable to choose a
 * role. This one can, and is only reachable behind `requireAdmin()`.
 */
export async function createAccount(input: {
  email: string;
  password: string;
  name: string;
  role: Role;
  roleTitle?: string;
  phone?: string;
  businessName?: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: "NON_CLIENT",
      name: input.name,
      phone: orNull(input.phone),
      businessName: orNull(input.businessName),
      ...(input.role === "TEAM_MEMBER"
        ? { teamProfile: { create: { roleTitle: orNull(input.roleTitle) } } }
        : {}),
    },
    select: IDENTITY,
  });
}
