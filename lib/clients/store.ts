import "server-only";

import { prisma } from "@/lib/db";

/**
 * Clients, the services they are on, and the staff who look after them.
 *
 * Activation is the one operation here that has to be all-or-nothing: it flips
 * the user's status, creates the client row and attaches the services in one
 * go, and a partial result would leave someone marked CLIENT with nothing to
 * see. So it runs in a transaction.
 */

export async function activateClient(input: {
  userId: string;
  companyName?: string | null;
  accountManagerId?: string | null;
  serviceIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: input.userId },
      data: { status: "CLIENT" },
      select: { id: true, email: true, name: true, businessName: true },
    });

    const client = await tx.client.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        companyName: input.companyName ?? user.businessName ?? null,
        accountManagerId: input.accountManagerId ?? null,
        onboardedAt: new Date(),
      },
      update: {
        ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
        ...(input.accountManagerId !== undefined
          ? { accountManagerId: input.accountManagerId }
          : {}),
        onboardedAt: new Date(),
      },
      select: { id: true },
    });

    if (input.serviceIds.length > 0) {
      /* `skipDuplicates` rather than a delete-and-recreate: re-running an
         activation with an extra service should add it, not restart every
         other service's clock. */
      await tx.clientService.createMany({
        data: input.serviceIds.map((serviceId) => ({ clientId: client.id, serviceId })),
        skipDuplicates: true,
      });
    }

    return { user, clientId: client.id };
  });
}

export async function setAccountManager(clientId: string, accountManagerId: string | null) {
  return prisma.client.update({
    where: { id: clientId },
    data: { accountManagerId },
    select: { id: true },
  });
}

export async function setClientServices(clientId: string, serviceIds: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.clientService.deleteMany({
      where: { clientId, serviceId: { notIn: serviceIds.length > 0 ? serviceIds : ["-"] } },
    });
    if (serviceIds.length > 0) {
      await tx.clientService.createMany({
        data: serviceIds.map((serviceId) => ({ clientId, serviceId })),
        skipDuplicates: true,
      });
    }
  });
}

const CLIENT_CARD = {
  id: true,
  companyName: true,
  onboardedAt: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  accountManager: { select: { id: true, user: { select: { name: true, email: true } } } },
  services: { select: { id: true, status: true, service: { select: { id: true, name: true } } } },
  _count: { select: { projects: true } },
} as const;

export async function listClients() {
  return prisma.client.findMany({ select: CLIENT_CARD, orderBy: { createdAt: "desc" } });
}

/** The clients one team member is the named contact for. */
export async function listClientsForManager(accountManagerId: string) {
  return prisma.client.findMany({
    where: { accountManagerId },
    select: CLIENT_CARD,
    orderBy: { createdAt: "desc" },
  });
}

export async function getClient(clientId: string) {
  return prisma.client.findUnique({ where: { id: clientId }, select: CLIENT_CARD });
}

export async function listServices() {
  return prisma.service.findMany({ orderBy: { name: "asc" } });
}

export async function listTeamMembers() {
  return prisma.teamMember.findMany({
    select: {
      id: true,
      roleTitle: true,
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { managedClients: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** The user ids to tell when something happens to a client. */
export async function audienceForClient(clientId: string): Promise<string[]> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true, accountManager: { select: { userId: true } } },
  });
  if (!client) return [];
  return [client.userId, client.accountManager?.userId].filter(
    (id): id is string => typeof id === "string",
  );
}
