import "server-only";

import { prisma } from "@/lib/db";

/**
 * Who did what.
 *
 * Written on the actions that change someone else's access or money —
 * activations, service assignments, staff accounts, deletions — and not on
 * ordinary edits, because a log that records everything is read by nobody.
 *
 * Never throws: an audit write that fails should be visible in the server log,
 * not turn a completed activation into an error the admin will retry.
 */
export async function audit(entry: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        meta: entry.meta ? (entry.meta as object) : undefined,
      },
    });
  } catch (error) {
    console.error("[audit] not written", entry.action, error);
  }
}

export async function listAudit(take = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { email: true, name: true } } },
  });
}
