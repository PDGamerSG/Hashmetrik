import "server-only";

import { prisma } from "@/lib/db";

/**
 * Projects, milestones and deliverables.
 *
 * The pattern that runs through this file: every read and every write that a
 * client could reach takes a `clientId` and puts it in the `where`, rather than
 * fetching by id and checking ownership afterwards. The check cannot then be
 * forgotten, and the query returns nothing at all for somebody else's row —
 * which is also the right answer to give back.
 */

export const DELIVERABLE_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "changes_requested",
] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_TYPES = [
  "poster",
  "reel",
  "blog",
  "report",
  "source_file",
  "other",
] as const;

export const PROJECT_STATUSES = ["active", "paused", "complete"] as const;

const PROJECT_CARD = {
  id: true,
  name: true,
  status: true,
  progress: true,
  startDate: true,
  endDate: true,
  clientId: true,
  service: { select: { id: true, name: true } },
  milestones: {
    select: { id: true, title: true, dueDate: true, completed: true, position: true },
    orderBy: { position: "asc" },
  },
  deliverables: {
    select: {
      id: true,
      title: true,
      type: true,
      fileUrl: true,
      status: true,
      createdAt: true,
      submittedAt: true,
      comments: {
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  },
} as const;

export async function listProjectsForClient(clientId: string) {
  return prisma.project.findMany({
    where: { clientId },
    select: PROJECT_CARD,
    orderBy: { createdAt: "desc" },
  });
}

/** Every project across the clients a team member looks after. */
export async function listProjectsForManager(accountManagerId: string) {
  return prisma.project.findMany({
    where: { client: { accountManagerId } },
    select: { ...PROJECT_CARD, client: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllProjects() {
  return prisma.project.findMany({
    select: { ...PROJECT_CARD, client: { select: { id: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createProject(input: {
  clientId: string;
  serviceId: string;
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  return prisma.project.create({
    data: {
      clientId: input.clientId,
      serviceId: input.serviceId,
      name: input.name,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
    select: { id: true, name: true, clientId: true },
  });
}

export async function updateProject(
  id: string,
  patch: { status?: string; progress?: number; name?: string; endDate?: Date | null },
) {
  return prisma.project.update({
    where: { id },
    data: {
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.status ? { status: patch.status } : {}),
      /* Clamped rather than validated: a slider that sends 140 is a bug in the
         form, and refusing the whole update would lose the rest of it. */
      ...(patch.progress !== undefined
        ? { progress: Math.max(0, Math.min(100, Math.round(patch.progress))) }
        : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate } : {}),
    },
    select: { id: true, name: true, clientId: true },
  });
}

export async function addMilestone(projectId: string, title: string, dueDate: Date | null) {
  const last = await prisma.milestone.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return prisma.milestone.create({
    data: { projectId, title, dueDate, position: (last?.position ?? 0) + 1 },
    select: { id: true },
  });
}

export async function toggleMilestone(id: string, completed: boolean) {
  return prisma.milestone.update({
    where: { id },
    data: { completed, completedAt: completed ? new Date() : null },
    select: { id: true, projectId: true, title: true },
  });
}

export async function createDeliverable(input: {
  projectId: string;
  title: string;
  type: string;
  fileUrl: string;
  submit: boolean;
}) {
  return prisma.deliverable.create({
    data: {
      projectId: input.projectId,
      title: input.title,
      type: input.type,
      fileUrl: input.fileUrl,
      status: input.submit ? "submitted" : "draft",
      submittedAt: input.submit ? new Date() : null,
    },
    select: { id: true, title: true, project: { select: { clientId: true } } },
  });
}

/** Moves a draft in front of the client. */
export async function submitDeliverable(id: string) {
  return prisma.deliverable.update({
    where: { id },
    data: { status: "submitted", submittedAt: new Date(), decidedAt: null },
    select: { id: true, title: true, project: { select: { clientId: true } } },
  });
}

/**
 * The client's verdict.
 *
 * Scoped by client id as well as deliverable id, and by the statuses a decision
 * can legitimately follow: a client cannot approve something still in draft,
 * because they were never shown it.
 */
export async function decideDeliverable(input: {
  deliverableId: string;
  clientId: string;
  status: Extract<DeliverableStatus, "approved" | "changes_requested">;
}) {
  const { count } = await prisma.deliverable.updateMany({
    where: {
      id: input.deliverableId,
      project: { clientId: input.clientId },
      status: { in: ["submitted", "approved", "changes_requested"] },
    },
    data: { status: input.status, decidedAt: new Date() },
  });
  if (count === 0) return null;

  return prisma.deliverable.findUnique({
    where: { id: input.deliverableId },
    select: { id: true, title: true, status: true },
  });
}

/**
 * Adds a comment.
 *
 * `clientId` is optional because staff post here too and are not scoped by one;
 * when it is given the deliverable must belong to that client, which is what
 * stops a client commenting on somebody else's work.
 */
export async function addComment(
  deliverableId: string,
  authorId: string,
  body: string,
  clientId?: string,
) {
  const deliverable = await prisma.deliverable.findFirst({
    where: {
      id: deliverableId,
      ...(clientId ? { project: { clientId } } : {}),
    },
    select: { id: true, title: true, project: { select: { clientId: true } } },
  });
  if (!deliverable) return null;

  await prisma.comment.create({ data: { deliverableId, authorId, body } });
  return {
    deliverableTitle: deliverable.title,
    clientId: deliverable.project.clientId,
  };
}

/** Everything waiting on somebody, for the team's queue. */
export async function listPendingDeliverables(accountManagerId?: string) {
  return prisma.deliverable.findMany({
    where: {
      status: { in: ["submitted", "changes_requested"] },
      ...(accountManagerId ? { project: { client: { accountManagerId } } } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      submittedAt: true,
      project: {
        select: { id: true, name: true, client: { select: { id: true, companyName: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });
}
