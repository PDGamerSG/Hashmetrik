import { PrismaClient } from "../lib/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Removes everything an end-to-end run leaves behind.
 *
 * The suite writes to the real database — there is no second one on a free tier
 * — so it has to be able to clean up after itself. Everything it creates is
 * prefixed or addressed `e2e-`, and nothing here touches a row that is not.
 *
 *   node --env-file=.env scripts/e2e-cleanup.ts
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const users = await prisma.user.findMany({
  where: { email: { startsWith: "e2e-" } },
  select: { id: true, email: true },
});
const ids = users.map((u) => u.id);

const clients = await prisma.client.findMany({
  where: { userId: { in: ids } },
  select: { id: true },
});
const clientIds = clients.map((c) => c.id);

/* Order matters where the foreign keys are not cascading, and doing it
   explicitly is clearer than relying on which ones are. */
const projects = await prisma.project.findMany({
  where: { clientId: { in: clientIds } },
  select: { id: true },
});
const projectIds = projects.map((p) => p.id);

const deliverables = await prisma.deliverable.findMany({
  where: { projectId: { in: projectIds } },
  select: { id: true },
});
const deliverableIds = deliverables.map((d) => d.id);

const removed = {
  comments: (await prisma.comment.deleteMany({ where: { deliverableId: { in: deliverableIds } } })).count,
  deliverables: (await prisma.deliverable.deleteMany({ where: { id: { in: deliverableIds } } })).count,
  milestones: (await prisma.milestone.deleteMany({ where: { projectId: { in: projectIds } } })).count,
  projects: (await prisma.project.deleteMany({ where: { id: { in: projectIds } } })).count,
  calendar: (await prisma.contentCalendarEntry.deleteMany({ where: { clientId: { in: clientIds } } })).count,
  kpis: (await prisma.kPIRecord.deleteMany({ where: { clientId: { in: clientIds } } })).count,
  clientServices: (await prisma.clientService.deleteMany({ where: { clientId: { in: clientIds } } })).count,
  consultations: (await prisma.consultation.deleteMany({ where: { userId: { in: ids } } })).count,
  notifications: (await prisma.notification.deleteMany({ where: { userId: { in: ids } } })).count,
  clients: (await prisma.client.deleteMany({ where: { id: { in: clientIds } } })).count,
  teamProfiles: (await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } })).count,
  leads: (
    await prisma.lead.deleteMany({
      where: { OR: [{ userId: { in: ids } }, { email: { startsWith: "e2e-" } }] },
    })
  ).count,
  audit: (await prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } })).count,
  users: (await prisma.user.deleteMany({ where: { id: { in: ids } } })).count,
  cms: (await prisma.cMSContent.deleteMany({ where: { slug: { startsWith: "e2e-" } } })).count,
  /* Also drop the ones an admin made while acting on e2e rows, so the trail
     does not fill up with runs. */
  auditOnE2e: (
    await prisma.auditLog.deleteMany({
      where: { entityId: { in: [...ids, ...clientIds, ...projectIds, ...deliverableIds] } },
    })
  ).count,
};

console.log(`Cleaned up ${users.length} e2e account(s):`);
for (const [table, count] of Object.entries(removed)) {
  if (count > 0) console.log(`  ${table}: ${count}`);
}

await prisma.$disconnect();
