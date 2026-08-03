import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { listClients, listClientsForManager, listServices } from "@/lib/clients/store";
import { currentPeriod, listKpis, recentPeriods } from "@/lib/kpis/store";
import { KpiForm } from "@/components/app/team-forms";
import { removeKpi } from "../actions";
import { Card, Empty, PageHeader, Section, SubmitButton } from "@/components/app/ui";

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
        <p className="label-xs text-slate">Record a number</p>
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
            <Section
              key={client.id}
              title={client.companyName ?? client.user.email}
              count={records.length}
            >
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-y border-ash text-left">
                      <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Metric</th>
                      <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Service</th>
                      <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Period</th>
                      <th scope="col" className="label-xs py-2.5 pr-4 text-right text-slate">
                        Value
                      </th>
                      <th scope="col" className="label-xs py-2.5 pr-4 text-right text-slate">
                        Source
                      </th>
                      <th scope="col" className="sr-only">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="group border-b border-ash transition-colors hover:bg-ink/[0.02]"
                      >
                        <td className="py-3 pr-4 font-medium text-ink">{record.metricName}</td>
                        <td className="py-3 pr-4 text-slate">{record.service?.name ?? "Overall"}</td>
                        <td className="tabular py-3 pr-4 text-slate">{record.period}</td>
                        <td className="tabular py-3 pr-4 text-right text-ink">
                          {record.value.toLocaleString("en-GB")}
                          {record.unit && (
                            <span className="ml-1 text-xs text-slate">{record.unit}</span>
                          )}
                        </td>
                        <td className="label-xs py-3 pr-4 text-right text-slate">
                          {record.source}
                        </td>
                        <td className="py-3 text-right">
                          {/* Quiet until the row is under the pointer: a column
                              of Remove buttons is a column of accidents. */}
                          <div className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                            <form action={removeKpi}>
                              <input type="hidden" name="id" value={record.id} />
                              <SubmitButton variant="quiet" size="sm" busyLabel="Removing…">
                                Remove
                              </SubmitButton>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ))
      )}
    </>
  );
}
