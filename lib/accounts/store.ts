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
 * making administrators. Staff accounts are made by `createStaff`, which is
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

/** Admin-created staff. Team members also get the `TeamMember` row they need. */
export async function createStaff(input: {
  email: string;
  password: string;
  name: string;
  role: Extract<Role, "TEAM_MEMBER" | "ADMIN">;
  roleTitle?: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      status: "NON_CLIENT",
      name: input.name,
      ...(input.role === "TEAM_MEMBER"
        ? { teamProfile: { create: { roleTitle: orNull(input.roleTitle) } } }
        : {}),
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
