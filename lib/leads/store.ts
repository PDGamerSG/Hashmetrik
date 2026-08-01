import "server-only";

import { prisma } from "@/lib/db";
import type { LeadInput, LeadStatus } from "./schema";

/** Empty optional fields are stored as null, so "not given" reads as null everywhere. */
function orNull(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function createLead(lead: LeadInput) {
  return prisma.lead.create({
    data: {
      kind: lead.kind,
      name: lead.name,
      email: lead.email,
      phone: orNull(lead.phone),
      company: orNull(lead.company),
      website: orNull(lead.website),
      industry: orNull(lead.industry),
      service: orNull(lead.service),
      budget: orNull(lead.budget),
      preferredDate: orNull(lead.preferredDate),
      preferredTime: orNull(lead.preferredTime),
      message: orNull(lead.message),
    },
  });
}

export async function markNotified(id: string) {
  return prisma.lead.update({ where: { id }, data: { notifiedAt: new Date() } });
}

export async function listLeads(filter: { status?: LeadStatus; kind?: string } = {}) {
  return prisma.lead.findMany({
    where: {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.kind ? { kind: filter.kind } : {}),
    },
    orderBy: { createdAt: "desc" },
    /* A cap rather than pagination: the dashboard is a working queue, and at
       this volume a second page is a control nobody would use. Revisit when the
       table actually runs long. */
    take: 200,
  });
}

export async function countLeadsByStatus() {
  const rows = await prisma.lead.groupBy({ by: ["status"], _count: { _all: true } });
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  return prisma.lead.update({ where: { id }, data: { status } });
}
