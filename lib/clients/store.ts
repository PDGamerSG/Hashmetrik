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
  assignments: {
    select: {
      teamMemberId: true,
      member: { select: { id: true, user: { select: { name: true, email: true } } } },
    },
  },
  _count: { select: { projects: true } },
} as const;

/**
 * Every client a team member should see.
 *
 * Being the account manager or being assigned — one `OR`, in the `where`, so a
 * page cannot forget half of it. This is the filter that decides what "your
 * accounts" means on `/team`, and it is deliberately the same shape as the
 * project query below.
 */
export function clientVisibleTo(teamMemberId: string) {
  return {
    OR: [{ accountManagerId: teamMemberId }, { assignments: { some: { teamMemberId } } }],
  };
}

export async function listClients() {
  return prisma.client.findMany({ select: CLIENT_CARD, orderBy: { createdAt: "desc" } });
}

/** The clients one team member is the named contact for, or is assigned to. */
export async function listClientsForManager(teamMemberId: string) {
  return prisma.client.findMany({
    where: clientVisibleTo(teamMemberId),
    select: CLIENT_CARD,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Replaces the set of team members on a client.
 *
 * Delete-then-create rather than a diff: the form posts the whole set, and
 * `createdAt` on an assignment is not load-bearing anywhere, so preserving it
 * for the rows that survive buys nothing. Wrapped in a transaction so a client
 * is never briefly assigned to nobody.
 */
export async function setClientTeam(clientId: string, teamMemberIds: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.clientAssignment.deleteMany({
      where: {
        clientId,
        teamMemberId: { notIn: teamMemberIds.length > 0 ? teamMemberIds : ["-"] },
      },
    });
    if (teamMemberIds.length > 0) {
      await tx.clientAssignment.createMany({
        data: teamMemberIds.map((teamMemberId) => ({ clientId, teamMemberId })),
        skipDuplicates: true,
      });
    }
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

/**
 * How many clients are on each service, and how much work that is.
 *
 * The PRD's example for the admin overview is "SMM by 20 clients" — the number
 * that says which part of the business is actually carrying the agency. Counted
 * per service rather than derived from the client list, because the client list
 * is what the overview is trying not to be.
 *
 * Two queries and a join in memory rather than three round trips per service:
 * the catalogue is six rows and will stay that shape.
 */
export async function serviceUptake() {
  const [services, byService, projects] = await Promise.all([
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.clientService.groupBy({
      by: ["serviceId"],
      where: { status: "active" },
      _count: { _all: true },
    }),
    prisma.project.groupBy({
      by: ["serviceId"],
      where: { status: "active" },
      _count: { _all: true },
    }),
  ]);

  const clients = new Map(byService.map((row) => [row.serviceId, row._count._all]));
  const active = new Map(projects.map((row) => [row.serviceId, row._count._all]));

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    clients: clients.get(service.id) ?? 0,
    projects: active.get(service.id) ?? 0,
  }));
}

/**
 * What each team member's accounts look like, for the PRD's "review performance".
 *
 * Measured across the clients somebody is the account manager for, not by who
 * pressed which button: `Deliverable` records no author, and inventing one from
 * the audit log would credit whoever happened to click submit rather than
 * whoever did the work. What this can say honestly is how much is open, how much
 * the client is sitting on, and what has run past its date — which is what a
 * one-to-one about workload is actually about.
 *
 * Read in one query and reduced in memory. Six team members and a few hundred
 * deliverables is not worth six round trips, and the shape below is a page, not
 * an export.
 */
export async function teamPerformance() {
  const members = await prisma.teamMember.findMany({
    select: {
      id: true,
      roleTitle: true,
      user: { select: { id: true, name: true, email: true } },
      /* Every account they are on, including the ones somebody else is the
         named contact for — the workload number, as against the ownership one
         below it. */
      _count: { select: { assignments: true } },
      managedClients: {
        select: {
          id: true,
          projects: {
            select: {
              status: true,
              endDate: true,
              progress: true,
              deliverables: { select: { status: true } },
              milestones: { select: { completed: true } },
            },
          },
          calendarEntries: { select: { approvalStatus: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();

  return members.map((member) => {
    const projects = member.managedClients.flatMap((client) => client.projects);
    const deliverables = projects.flatMap((project) => project.deliverables);
    const milestones = projects.flatMap((project) => project.milestones);
    const calendar = member.managedClients.flatMap((client) => client.calendarEntries);
    const active = projects.filter((project) => project.status === "active");

    return {
      id: member.id,
      roleTitle: member.roleTitle,
      user: member.user,
      clients: member.managedClients.length,
      assigned: member._count.assignments,
      activeProjects: active.length,
      /* Averaged over the active ones only: a finished project sitting at 100
         and an archived one at 40 would both drag the number away from what is
         actually in flight. */
      averageProgress:
        active.length === 0
          ? null
          : Math.round(active.reduce((sum, p) => sum + p.progress, 0) / active.length),
      overdue: active.filter((project) => project.endDate && project.endDate < now).length,
      awaitingClient: deliverables.filter((d) => d.status === "submitted").length,
      changesRequested: deliverables.filter((d) => d.status === "changes_requested").length,
      approved: deliverables.filter((d) => d.status === "approved").length,
      milestonesDone: milestones.filter((m) => m.completed).length,
      milestonesTotal: milestones.length,
      calendarPending: calendar.filter((entry) => entry.approvalStatus === "pending").length,
    };
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
