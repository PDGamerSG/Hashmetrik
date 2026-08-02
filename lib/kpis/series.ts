/**
 * Period arithmetic and the shape a chart wants.
 *
 * Free of `server-only` and Prisma on purpose: this is the part worth testing,
 * and it should be runnable by `node --test` without a database behind it —
 * the same split as `lib/leads/schema.ts` against `lib/leads/store.ts`.
 */

/** `YYYY-MM`. A label rather than an instant: a month has no timezone. */
export function currentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function isPeriod(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/**
 * The last `count` periods, newest first.
 *
 * Built by stepping a `Date` rather than subtracting from the month number, so
 * January minus one is December of the year before rather than month `-1`.
 */
export function recentPeriods(count = 6, now: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) =>
    currentPeriod(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
}

export type MetricSeries = {
  metricName: string;
  unit: string | null;
  points: { period: string; value: number }[];
};

/**
 * Groups records by metric so a page can draw one row per metric across months.
 *
 * Here rather than in the page because it is the shape both the client's report
 * and the team's entry screen want, and two copies of it would drift. The sort
 * matters: the chart draws a line straight from `points`, and an out-of-order
 * entry is a line that doubles back on itself.
 */
export function toSeries(
  records: { metricName: string; unit: string | null; period: string; value: number }[],
): MetricSeries[] {
  const byMetric = new Map<string, MetricSeries>();

  for (const record of records) {
    const existing = byMetric.get(record.metricName);
    if (existing) {
      existing.points.push({ period: record.period, value: record.value });
    } else {
      byMetric.set(record.metricName, {
        metricName: record.metricName,
        unit: record.unit,
        points: [{ period: record.period, value: record.value }],
      });
    }
  }

  return [...byMetric.values()].map((series) => ({
    ...series,
    points: series.points.sort((a, b) => a.period.localeCompare(b.period)),
  }));
}
