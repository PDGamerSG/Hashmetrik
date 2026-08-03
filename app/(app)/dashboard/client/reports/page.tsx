import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/dal";
import { listKpis, recentPeriods, toSeries } from "@/lib/kpis/store";
import { MetricChart } from "@/components/app/metric-chart";
import { Card, Empty, PageHeader, Section } from "@/components/app/ui";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function ClientReportsPage() {
  const { client } = await requireClient();

  const periods = recentPeriods(6);
  const records = await listKpis(client.id, periods);
  const series = toSeries(records);

  /* Grouped by service so a client on both SEO and paid reads two reports
     rather than one list of numbers with no owner. */
  const byService = records.reduce<Map<string, Set<string>>>((acc, record) => {
    const name = record.service?.name ?? "Overall";
    const bucket = acc.get(name) ?? new Set<string>();
    bucket.add(record.metricName);
    acc.set(name, bucket);
    return acc;
  }, new Map());

  return (
    <>
      <PageHeader
        title="Reports"
        meta={`Last ${periods.length} months · ${series.length} metric${series.length === 1 ? "" : "s"}`}
      />

      {series.length === 0 ? (
        <Empty>
          No numbers yet. Your account manager records them each month, and they appear here as
          soon as they do.
        </Empty>
      ) : (
        [...byService.entries()].map(([serviceName, metrics]) => (
          <Section key={serviceName} title={serviceName} count={metrics.size}>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {series
                .filter((s) => metrics.has(s.metricName))
                .map((s) => (
                  <Card
                    key={`${serviceName}-${s.metricName}`}
                    className="transition-colors hover:border-ink/25"
                  >
                    <MetricChart series={s} />
                  </Card>
                ))}
            </div>
          </Section>
        ))
      )}
    </>
  );
}
