import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { listClients, listServices, listTeamMembers } from "@/lib/clients/store";
import { assignAccountManager, assignServices } from "../actions";
import {
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  SubmitButton,
  formatDate,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

/**
 * Who is on what, and who looks after them.
 *
 * Both controls are plain forms rather than anything live: an account manager
 * or a service list changed by accident on a mis-click is worse than one that
 * takes a deliberate press of Save.
 */
export default async function AdminClientsPage() {
  await requireAdmin();

  const [clients, services, managers] = await Promise.all([
    listClients(),
    listServices(),
    listTeamMembers(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Clients"
        meta={`${clients.length} active · ${managers.length} account manager${managers.length === 1 ? "" : "s"}`}
      />

      {clients.length === 0 ? (
        <Empty>
          No clients yet. Activate a registered account from the Accounts page and it appears here.
        </Empty>
      ) : (
        <ul className="mt-8 space-y-6">
          {clients.map((client) => {
            const assigned = new Set(client.services.map((s) => s.service.id));

            return (
              <Card as="li" key={client.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-xl font-medium text-ink">
                      {client.companyName ?? client.user.name ?? client.user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      <a href={`mailto:${client.user.email}`} className="underline underline-offset-2">
                        {client.user.email}
                      </a>
                      {client.user.phone && ` · ${client.user.phone}`}
                    </p>
                  </div>

                  <form action={assignAccountManager} className="flex items-end gap-2">
                    <input type="hidden" name="clientId" value={client.id} />
                    <label htmlFor={`am-${client.id}`} className="sr-only">
                      Account manager
                    </label>
                    <select
                      id={`am-${client.id}`}
                      name="accountManagerId"
                      defaultValue={client.accountManager?.id ?? ""}
                      className="h-10 rounded-sheet border border-ash bg-bone px-3 text-sm text-ink"
                    >
                      <option value="">Unassigned</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.user.name ?? m.user.email}
                        </option>
                      ))}
                    </select>
                    <SubmitButton>Assign</SubmitButton>
                  </form>
                </div>

                <Details>
                  <Detail label="Client since" value={formatDate(client.onboardedAt)} />
                  <Detail label="Projects" value={String(client._count.projects)} />
                  <Detail label="Services" value={String(client.services.length)} />
                </Details>

                <form action={assignServices} className="mt-4 border-t border-ash pt-4">
                  <input type="hidden" name="clientId" value={client.id} />
                  <fieldset>
                    <legend className="label-sm text-slate">Services</legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {services.map((service) => (
                        <label key={service.id} className="flex items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            name="serviceIds"
                            value={service.id}
                            defaultChecked={assigned.has(service.id)}
                            className="size-4"
                          />
                          {service.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="mt-4">
                    <SubmitButton>Save services</SubmitButton>
                  </div>
                </form>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
