import "server-only";

import { prisma } from "@/lib/db";
import { WINDOW_MS, windowKey } from "./window";

export type LimitResult = { allowed: boolean; count: number; limit: number };

/**
 * Counts one request against `key` and says whether it may proceed.
 *
 * The counter lives in Postgres because serverless instances share no memory —
 * an in-process map would reset on every cold start and a scripted client would
 * walk straight through it.
 *
 * The upsert is atomic, so two concurrent requests cannot both read the same
 * count and both write count+1.
 */
export async function consume(key: string, limit: number): Promise<LimitResult> {
  const window = windowKey();

  const row = await prisma.rateHit.upsert({
    where: { key_window: { key, window } },
    create: { key, window, count: 1 },
    update: { count: { increment: 1 } },
  });

  void sweep();

  return { allowed: row.count <= limit, count: row.count, limit };
}

/**
 * Drops expired windows, roughly one request in fifty.
 *
 * There is no cron on this path and the table would otherwise grow a row per
 * visitor per hour forever. Sampling keeps the delete off the hot path without
 * needing a scheduler; awaiting it is pointless since nothing depends on the
 * result, and a failure is a few stale rows.
 */
function sweep(): void {
  if (Math.random() > 0.02) return;
  const cutoff = new Date(Date.now() - WINDOW_MS * 2);
  prisma.rateHit
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .catch((error) => console.error("[rate-limit] sweep failed", error));
}
