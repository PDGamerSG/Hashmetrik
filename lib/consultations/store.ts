import "server-only";

import { prisma } from "@/lib/db";

/**
 * Consultations — the call between an enquiry and a client.
 *
 * `status` is a string rather than an enum for the same reason the lead
 * pipeline is: the vocabulary belongs to the sales team, and renaming a stage
 * should not cost a migration. The set is fixed here so nothing else has to
 * guess it.
 */
export const CONSULTATION_STATUSES = [
  "requested",
  "scheduled",
  "completed",
  "cancelled",
] as const;
export type ConsultationStatus = (typeof CONSULTATION_STATUSES)[number];

export function isConsultationStatus(value: unknown): value is ConsultationStatus {
  return (
    typeof value === "string" && (CONSULTATION_STATUSES as readonly string[]).includes(value)
  );
}

const CARD = {
  id: true,
  status: true,
  scheduledAt: true,
  topic: true,
  notes: true,
  createdAt: true,
  userId: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  lead: { select: { id: true, name: true, email: true, service: true } },
} as const;

export async function requestConsultation(input: {
  userId: string;
  topic?: string;
  notes?: string;
}) {
  return prisma.consultation.create({
    data: {
      userId: input.userId,
      topic: input.topic?.slice(0, 120) || null,
      notes: input.notes?.slice(0, 2000) || null,
    },
    select: CARD,
  });
}

/** Raised by the team from an enquiry that came in through the site. */
export async function consultationFromLead(leadId: string, userId?: string | null) {
  return prisma.consultation.create({
    data: { leadId, userId: userId ?? null },
    select: CARD,
  });
}

export async function listConsultations(filter: { status?: string } = {}) {
  return prisma.consultation.findMany({
    where: filter.status ? { status: filter.status } : {},
    select: CARD,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
}

export async function listConsultationsForUser(userId: string) {
  return prisma.consultation.findMany({
    where: { userId },
    select: CARD,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Applies whichever of the three fields were sent.
 *
 * Returns null for an unknown status rather than writing a stage nothing else
 * recognises — the filters, the badges and the client's copy all switch on this
 * value, and a typo would produce a consultation that never appears again.
 */
export async function setConsultation(
  id: string,
  patch: { status?: string; scheduledAt?: Date | null; notes?: string },
) {
  if (patch.status !== undefined && !isConsultationStatus(patch.status)) return null;

  return prisma.consultation.update({
    where: { id },
    data: {
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.scheduledAt !== undefined ? { scheduledAt: patch.scheduledAt } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes || null } : {}),
    },
    select: CARD,
  });
}
