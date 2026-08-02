import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { listClients, listClientsForManager, listServices } from "@/lib/clients/store";
import { currentPeriod, listKpis, recentPeriods } from "@/lib/kpis/store";
import { KpiForm } from "@/components/app/team-forms";
import { removeKpi } from "../actions";
import {
  Card,
  Empty,
  PageHeader,
  SectionTitle,
  SubmitButton,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

/**
 * Where the numbers get typed in.
 *
 * Manual entry first, deliberately: it needs no API approvals, costs nothing,
 * and a team that has been typing numbers for a month knows exactly which ones
 * a sync would have to produce. `source` on each row is what will let a later
 * Meta or Google job overwrite its own and leave these alone.
 */
export default async function TeamReportsPage() {
  const { viewer, member } = await requireTeamMember();
  const scope = viewer.role === "ADMIN" ? undefined : member?.id;

  const [clients, services] = await Promise.all([
    scope ? listClientsForManager(scope) : listClients(),
    listServices(),
  ]);

  const periods = recentPeriods(6);

  /* One query per client rather than one for everything: the page is a table
     per client, and at this scale the round trips are cheaper than sorting a
     flat list back into groups. */
  const rows = await Promise.all(
    clients.map(async (client) => ({
      client,
      records: await listKpis(client.id, periods),
    })),
  );

  return (
    <>
      <PageHeader
        title="Reports"
        meta={`Recording for ${currentPeriod()} · ${clients.length} account${clients.length === 1 ? "" : "s"}`}
      />

      <Card className="mt-8">
        <SectionTitle>Record a number</SectionTitle>
        <div className="mt-4">
          <KpiForm
            clients={clients.map((c) => ({
              id: c.id,
              name: c.companyName ?? c.user.name ?? c.user.email,
            }))}
            services={services.map((s) => ({ id: s.id, name: s.name }))}
            period={currentPeriod()}
          />
        </div>
      </Card>

      {rows.every((row) => row.records.length === 0) ? (
        <Empty>Nothing recorded in the last six months.</Empty>
      ) : (
        rows
          .filter((row) => row.records.length > 0)
          .map(({ client, records }) => (
            <section key={client.id} className="mt-10">
              <SectionTitle count={records.length}>
                {client.companyName ?? client.user.email}
              </SectionTitle>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-ash text-left">
                      <th scope="col" className="label-sm py-2 text-slate">Metric</th>
                      <th scope="col" className="label-sm py-2 text-slate">Service</th>
                      <th scope="col" className="label-sm py-2 text-slate">Period</th>
                      <th scope="col" className="label-sm py-2 text-right text-slate">Value</th>
                      <th scope="col" className="label-sm py-2 text-right text-slate">Source</th>
                      <th scope="col" className="sr-only">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr key={record.id} className="border-b border-ash/60">
                        <td className="py-2 text-ink">{record.metricName}</td>
                        <td className="py-2 text-slate">{record.service?.name ?? "Overall"}</td>
                        <td className="tabular py-2 text-slate">{record.period}</td>
                        <td className="tabular py-2 text-right text-ink">
                          {record.value.toLocaleString("en-GB")}
                          {record.unit && <span className="ml-1 text-xs text-slate">{record.unit}</span>}
                        </td>
                        <td className="py-2 text-right text-xs text-slate">{record.source}</td>
                        <td className="py-2 text-right">
                          <form action={removeKpi}>
                            <input type="hidden" name="id" value={record.id} />
                            <SubmitButton variant="quiet">Remove</SubmitButton>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
      )}
    </>
  );
}
