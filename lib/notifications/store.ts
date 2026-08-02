import "server-only";

import { prisma } from "@/lib/db";

/**
 * In-app notifications.
 *
 * A row rather than an email or a socket: at this volume the dashboard can read
 * them on load, nothing has to be delivered in real time, and a notification
 * that outlives the session is more useful than one that interrupts.
 *
 * Every caller treats a failure here as unimportant — a lost notice must never
 * fail the action that produced it — so these are written to be awaited inside
 * a `catch`, not to be relied on.
 */
export async function notify(
  userId: string,
  message: string,
  options: { href?: string; type?: string } = {},
) {
  return prisma.notification.create({
    data: {
      userId,
      message,
      href: options.href ?? null,
      type: options.type ?? "info",
    },
  });
}

/** The same notice to several people, in one round trip. */
export async function notifyMany(
  userIds: string[],
  message: string,
  options: { href?: string; type?: string } = {},
) {
  if (userIds.length === 0) return { count: 0 };
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      message,
      href: options.href ?? null,
      type: options.type ?? "info",
    })),
  });
}

export async function listNotifications(userId: string, take = 30) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/** Scoped by user id as well as notification id, so one cannot read another's. */
export async function markRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
