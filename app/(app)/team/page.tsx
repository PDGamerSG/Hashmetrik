import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { listClients, listClientsForManager } from "@/lib/clients/store";
import { listPendingDeliverables } from "@/lib/projects/store";
import { listCalendarForManager } from "@/lib/calendar/store";
import {
  ButtonLink,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Row,
  Rows,
  Section,
  formatDate,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Team queue" };
export const dynamic = "force-dynamic";

/**
 * What is waiting on somebody, and who it belongs to.
 *
 * A team member sees their own accounts; an administrator sees everything,
 * because they are the one covering the gaps. That is the only difference
 * between the two views, so it is one ternary rather than two pages.
 */
export default async function TeamQueuePage() {
  const { viewer, member } = await requireTeamMember();
  const scope = viewer.role === "ADMIN" ? undefined : member?.id;

  const [clients, pending, calendar] = await Promise.all([
    scope ? listClientsForManager(scope) : listClients(),
    listPendingDeliverables(scope),
    listCalendarForManager(scope),
  ]);

  const awaitingClient = pending.filter((d) => d.status === "submitted");
  const needingWork = pending.filter((d) => d.status === "changes_requested");
  const calendarPending = calendar.filter((c) => c.approvalStatus === "pending");

  return (
    <>
      <PageHeader
        title="Queue"
        meta={
          needingWork.length > 0
            ? `${needingWork.length} item${needingWork.length === 1 ? "" : "s"} came back for changes.`
            : "Nothing has been sent back to you."
        }
      />

      <Readouts className="lg:grid-cols-3">
        <Readout
          label="Changes requested"
          value={needingWork.length}
          note="Your move"
          urgent
        />
        <Readout
          label="Waiting on clients"
          value={awaitingClient.length + calendarPending.length}
          note="Files and posts sent for approval"
        />
        <Readout
          label={scope ? "Your accounts" : "All accounts"}
          value={clients.length}
          note={scope ? "You are the named contact or assigned" : "Across the agency"}
        />
      </Readouts>

      <Section title="Changes requested" count={needingWork.length}>
        {needingWork.length === 0 ? (
          <Empty>Nothing has been sent back.</Empty>
        ) : (
          /* The urgency is already carried by the section this list sits under
             and by the note the client wrote. A coral slab down each row's edge
             as well made every line in the queue shout. */
          <Rows>
            {needingWork.map((d) => (
              <Row
                key={d.id}
                title={d.title}
                subtitle={`${d.project.client.companyName ?? "Client"} · ${d.project.name}`}
                trailing={
                  <ButtonLink href="/team/projects" variant="quiet" size="sm">
                    Open
                  </ButtonLink>
                }
              />
            ))}
          </Rows>
        )}
      </Section>

      <Section
        title="Waiting on clients"
        count={awaitingClient.length + calendarPending.length}
      >
        {awaitingClient.length + calendarPending.length === 0 ? (
          <Empty>Nothing is sitting with a client.</Empty>
        ) : (
          <Rows>
            {awaitingClient.map((d) => (
              <Row
                key={d.id}
                title={d.title}
                subtitle={d.project.client.companyName ?? "Client"}
                meta={[{ label: "Sent", value: formatDate(d.submittedAt) }]}
                status={<Pill tone="live">Deliverable</Pill>}
              />
            ))}
            {calendarPending.map((c) => (
              <Row
                key={c.id}
                title={`${c.platform} post`}
                subtitle={c.client.companyName ?? "Client"}
                meta={[{ label: "Publishes", value: formatDate(c.publishDate) }]}
                status={<Pill tone="live">Calendar</Pill>}
              />
            ))}
          </Rows>
        )}
      </Section>

      <Section title="Accounts" count={clients.length}>
        {clients.length === 0 ? (
          <Empty>No accounts assigned to you yet.</Empty>
        ) : (
          <ul className="mt-5 space-y-4">
            {clients.map((client) => (
              <li
                key={client.id}
                className="rounded-sheet border border-ash bg-bone-2 p-5 transition-colors hover:border-ink/25 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight font-medium text-ink">
                      {client.companyName ?? client.user.name ?? client.user.email}
                    </p>
                    <p className="mt-1.5 text-sm text-slate">{client.user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {client.services.map((s) => (
                      <Pill key={s.id} tone={s.status === "active" ? "live" : "done"} dot>
                        {s.service.name}
                      </Pill>
                    ))}
                  </div>
                </div>

                <Details>
                  <Detail label="Since" value={formatDate(client.onboardedAt)} />
                  <Detail label="Projects" value={String(client._count.projects)} />
                  <Detail
                    label="Account manager"
                    value={
                      client.accountManager
                        ? (client.accountManager.user.name ?? client.accountManager.user.email)
                        : "Unassigned"
                    }
                  />
                  <Detail label="Phone" value={client.user.phone} />
                </Details>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
