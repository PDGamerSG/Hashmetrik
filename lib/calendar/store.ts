import "server-only";

import { prisma } from "@/lib/db";

/**
 * The content calendar.
 *
 * Same rule as the projects store: anything a client can reach is scoped by
 * `clientId` inside the `where`, never fetched and then checked.
 */

export const PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "Facebook",
  "X",
  "YouTube",
  "Blog",
] as const;

export const APPROVALS = ["pending", "approved", "changes_requested"] as const;

const ENTRY = {
  id: true,
  platform: true,
  caption: true,
  creativeUrl: true,
  publishDate: true,
  approvalStatus: true,
  note: true,
  clientId: true,
} as const;

export async function listCalendar(clientId: string, from?: Date) {
  return prisma.contentCalendarEntry.findMany({
    where: {
      clientId,
      /* Default to the last week onwards: a calendar is about what is coming,
         but something published yesterday is still the thing people ask about
         this morning. */
      publishDate: { gte: from ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    select: ENTRY,
    orderBy: { publishDate: "asc" },
  });
}

export async function listCalendarForManager(accountManagerId?: string) {
  return prisma.contentCalendarEntry.findMany({
    where: accountManagerId ? { client: { accountManagerId } } : {},
    select: { ...ENTRY, client: { select: { id: true, companyName: true } } },
    orderBy: { publishDate: "asc" },
    take: 200,
  });
}

export async function createCalendarEntry(input: {
  clientId: string;
  platform: string;
  caption?: string;
  creativeUrl?: string;
  publishDate: Date;
}) {
  return prisma.contentCalendarEntry.create({
    data: {
      clientId: input.clientId,
      platform: input.platform,
      caption: input.caption || null,
      creativeUrl: input.creativeUrl || null,
      publishDate: input.publishDate,
    },
    select: ENTRY,
  });
}

export async function updateCalendarEntry(
  id: string,
  patch: { platform?: string; caption?: string; creativeUrl?: string; publishDate?: Date },
) {
  return prisma.contentCalendarEntry.update({
    where: { id },
    data: {
      ...(patch.platform ? { platform: patch.platform } : {}),
      ...(patch.caption !== undefined ? { caption: patch.caption || null } : {}),
      ...(patch.creativeUrl !== undefined ? { creativeUrl: patch.creativeUrl || null } : {}),
      ...(patch.publishDate ? { publishDate: patch.publishDate } : {}),
      /* Any edit puts it back in front of the client: an approved caption that
         has since been rewritten is not an approved caption. */
      approvalStatus: "pending",
    },
    select: ENTRY,
  });
}

export async function deleteCalendarEntry(id: string) {
  return prisma.contentCalendarEntry.delete({ where: { id }, select: { id: true } });
}

/** The client's verdict, scoped so it can only land on their own calendar. */
export async function decideCalendarEntry(
  id: string,
  clientId: string,
  approvalStatus: "approved" | "changes_requested",
  note?: string,
) {
  const { count } = await prisma.contentCalendarEntry.updateMany({
    where: { id, clientId },
    data: { approvalStatus, ...(note ? { note } : {}) },
  });
  if (count === 0) return null;

  return prisma.contentCalendarEntry.findUnique({ where: { id }, select: ENTRY });
}
