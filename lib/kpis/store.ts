import "server-only";

import { prisma } from "@/lib/db";

/**
 * KPI records — one number, for one client, for one period.
 *
 * Entered by hand. The plan has a Vercel Cron job pulling from Meta and Google
 * once those integrations are approved; `source` exists so that job can
 * overwrite its own rows without touching anything a person typed.
 *
 * The period arithmetic and the chart shape live in `series.ts` so they can be
 * tested without a database — see the note there.
 */
export {
  currentPeriod,
  isPeriod,
  recentPeriods,
  toSeries,
  type MetricSeries,
} from "./series";

const RECORD = {
  id: true,
  metricName: true,
  value: true,
  unit: true,
  period: true,
  source: true,
  service: { select: { id: true, name: true } },
} as const;

export async function listKpis(clientId: string, periods?: string[]) {
  return prisma.kPIRecord.findMany({
    where: { clientId, ...(periods?.length ? { period: { in: periods } } : {}) },
    select: RECORD,
    orderBy: [{ period: "desc" }, { metricName: "asc" }],
  });
}

/**
 * Records a number, replacing the one already there for that month.
 *
 * A find-then-write rather than `upsert`, because the key is partly nullable:
 * an overall metric has no service, and Postgres treats NULLs in a unique index
 * as distinct from each other, so the constraint would not catch a second
 * "Overall / Impressions / 2026-08" row and `upsert` could not target the first
 * one. Matching explicitly is the only version that behaves the same whether or
 * not a service is attached. The unique index stays as a backstop for the rows
 * that do have one.
 */
export async function upsertKpi(input: {
  clientId: string;
  serviceId: string | null;
  metricName: string;
  value: number;
  unit?: string | null;
  period: string;
  source?: string;
}) {
  const existing = await prisma.kPIRecord.findFirst({
    where: {
      clientId: input.clientId,
      serviceId: input.serviceId,
      metricName: input.metricName,
      period: input.period,
    },
    select: { id: true },
  });

  if (existing) {
    return prisma.kPIRecord.update({
      where: { id: existing.id },
      data: {
        value: input.value,
        unit: input.unit ?? null,
        source: input.source ?? "manual",
      },
      select: RECORD,
    });
  }

  return prisma.kPIRecord.create({
    data: {
      clientId: input.clientId,
      serviceId: input.serviceId,
      metricName: input.metricName,
      value: input.value,
      unit: input.unit ?? null,
      period: input.period,
      source: input.source ?? "manual",
    },
    select: RECORD,
  });
}

export async function deleteKpi(id: string) {
  return prisma.kPIRecord.delete({ where: { id }, select: { id: true } });
}
