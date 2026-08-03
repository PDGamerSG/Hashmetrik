import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { listClients, listServices, listTeamMembers } from "@/lib/clients/store";
import { assignAccountManager, assignServices, assignTeam } from "../actions";
import {
  Card,
  Check,
  Detail,
  Details,
  Empty,
  Fieldset,
  PageHeader,
  Pill,
  Select,
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

  const unmanaged = clients.filter((client) => !client.accountManager).length;

  return (
    <>
      <PageHeader
        title="Clients"
        meta={
          clients.length === 0
            ? "Activate a registered account and it appears here."
            : `${clients.length} account${clients.length === 1 ? "" : "s"} · ${managers.length} manager${managers.length === 1 ? "" : "s"}${unmanaged > 0 ? ` · ${unmanaged} unassigned` : ""}`
        }
      />

      {clients.length === 0 ? (
        <Empty>
          No clients yet. Activate a registered account from the Accounts page and it appears here.
        </Empty>
      ) : (
        <ul className="mt-8 space-y-5">
          {clients.map((client) => {
            const assigned = new Set(client.services.map((s) => s.service.id));
            const team = new Set(client.assignments.map((a) => a.teamMemberId));

            return (
              <Card as="li" key={client.id} className="transition-colors hover:border-ink/25">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-display text-xl leading-tight font-medium text-ink">
                        {client.companyName ?? client.user.name ?? client.user.email}
                      </p>
                      {!client.accountManager && <Pill tone="warn" dot>Unassigned</Pill>}
                    </div>
                    <p className="mt-2 text-sm text-slate">
                      <a
                        href={`mailto:${client.user.email}`}
                        className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                      >
                        {client.user.email}
                      </a>
                      {client.user.phone && ` · ${client.user.phone}`}
                    </p>
                  </div>

                  <form
                    action={assignAccountManager}
                    className="flex shrink-0 flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="clientId" value={client.id} />
                    <Select
                      id={`am-${client.id}`}
                      name="accountManagerId"
                      label="Account manager"
                      defaultValue={client.accountManager?.id ?? ""}
                      className="w-52"
                    >
                      <option value="">Unassigned</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.user.name ?? m.user.email}
                        </option>
                      ))}
                    </Select>
                    <SubmitButton busyLabel="Assigning…">Assign</SubmitButton>
                  </form>
                </div>

                <Details>
                  <Detail label="Client since" value={formatDate(client.onboardedAt)} />
                  <Detail label="Projects" value={String(client._count.projects)} />
                  <Detail label="Services" value={String(client.services.length)} />
                  <Detail
                    label="Team"
                    value={
                      client.assignments
                        .map((a) => a.member.user.name ?? a.member.user.email)
                        .join(", ") || null
                    }
                  />
                </Details>

                {/* Who works on the account, as against who answers the phone.
                    A person has to be able to see a client to do anything for
                    them: `/team` scopes every list by exactly this set plus the
                    account manager. */}
                <form action={assignTeam}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <Fieldset
                    legend="Team on this account"
                    action={
                      managers.length > 0 && (
                        <SubmitButton variant="quiet" size="sm" busyLabel="Saving…">
                          Save team
                        </SubmitButton>
                      )
                    }
                  >
                    {managers.length === 0 ? (
                      <p className="mt-3 text-sm text-slate">
                        No team members yet. Add one on the Staff page.
                      </p>
                    ) : (
                      <div className="mt-2 -ml-2 grid gap-x-4 sm:grid-cols-3">
                        {managers.map((member) => (
                          <Check
                            key={member.id}
                            name="teamMemberIds"
                            value={member.id}
                            defaultChecked={team.has(member.id)}
                          >
                            {member.user.name ?? member.user.email}
                          </Check>
                        ))}
                      </div>
                    )}
                  </Fieldset>
                </form>

                <form action={assignServices}>
                  <input type="hidden" name="clientId" value={client.id} />
                  <Fieldset
                    legend="Services"
                    action={
                      services.length > 0 && (
                        <SubmitButton variant="quiet" size="sm" busyLabel="Saving…">
                          Save services
                        </SubmitButton>
                      )
                    }
                  >
                    {services.length === 0 ? (
                      <p className="mt-3 text-sm text-slate">
                        The catalogue is empty. Add services in Settings.
                      </p>
                    ) : (
                      <div className="mt-2 -ml-2 grid gap-x-4 sm:grid-cols-3">
                        {services.map((service) => (
                          <Check
                            key={service.id}
                            name="serviceIds"
                            value={service.id}
                            defaultChecked={assigned.has(service.id)}
                          >
                            {service.name}
                          </Check>
                        ))}
                      </div>
                    )}
                  </Fieldset>
                </form>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
