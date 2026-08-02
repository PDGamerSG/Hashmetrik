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

/**
 * Ties an enquiry to the account of the person who sent it.
 *
 * The two arrive separately — somebody fills in the contact form on Monday and
 * signs up on Thursday — and matching them is what lets the pipeline and the
 * dashboard stop being two stories about the same person.
 */
export async function linkLeadToUser(id: string, userId: string) {
  return prisma.lead.update({ where: { id }, data: { userId } });
}

/** A registered user's own enquiries, for their dashboard. */
export async function listLeadsForUser(userId: string) {
  return prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The enquiry an address sent, if any, newest first.
 *
 * Used at signup to attach a visitor's earlier form submission to the account
 * they have just made, without asking them to tell us they wrote in.
 */
export async function findUnlinkedLeadsByEmail(email: string) {
  return prisma.lead.findMany({
    where: { email, userId: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
}

export async function attachLeadsToUser(email: string, userId: string) {
  return prisma.lead.updateMany({ where: { email, userId: null }, data: { userId } });
}
