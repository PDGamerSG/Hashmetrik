import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { listClients, listClientsForManager } from "@/lib/clients/store";
import { listPendingDeliverables } from "@/lib/projects/store";
import { listCalendarForManager } from "@/lib/calendar/store";
import {
  ButtonLink,
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
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
          scope
            ? `${clients.length} account${clients.length === 1 ? "" : "s"} you look after`
            : `${clients.length} client${clients.length === 1 ? "" : "s"} across the agency`
        }
      />

      <section className="mt-8">
        <SectionTitle count={needingWork.length}>Changes requested</SectionTitle>
        {needingWork.length === 0 ? (
          <Empty>Nothing has been sent back. </Empty>
        ) : (
          /* The urgency is already carried by the section this list sits under
             and by the note the client wrote. A coral slab down each card's
             edge as well made every row in the queue shout. */
          <ul className="mt-4 space-y-3">
            {needingWork.map((d) => (
              <Card as="li" key={d.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 text-sm text-ink">
                    <span className="font-medium">{d.title}</span>{" "}
                    <span className="text-slate">
                      · {d.project.client.companyName ?? "Client"} · {d.project.name}
                    </span>
                  </p>
                  <ButtonLink href="/team/projects" variant="quiet" size="sm">
                    Open
                  </ButtonLink>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle count={awaitingClient.length + calendarPending.length}>
          Waiting on clients
        </SectionTitle>
        {awaitingClient.length + calendarPending.length === 0 ? (
          <Empty>Nothing is sitting with a client.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {awaitingClient.map((d) => (
              <Card as="li" key={d.id}>
                <p className="text-sm text-ink">
                  <span className="font-medium">{d.title}</span>{" "}
                  <span className="text-slate">
                    · {d.project.client.companyName ?? "Client"} · sent{" "}
                    {formatDate(d.submittedAt)}
                  </span>
                </p>
              </Card>
            ))}
            {calendarPending.map((c) => (
              <Card as="li" key={c.id}>
                <p className="text-sm text-ink">
                  <span className="font-medium">{c.platform} post</span>{" "}
                  <span className="text-slate">
                    · {c.client.companyName ?? "Client"} · {formatDate(c.publishDate)}
                  </span>
                </p>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle count={clients.length}>Accounts</SectionTitle>
        {clients.length === 0 ? (
          <Empty>No accounts assigned to you yet.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {clients.map((client) => (
              <Card as="li" key={client.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-medium text-ink">
                      {client.companyName ?? client.user.name ?? client.user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate">{client.user.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {client.services.map((s) => (
                      <Pill key={s.id} tone={s.status === "active" ? "live" : "done"}>
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
                        ? client.accountManager.user.name ?? client.accountManager.user.email
                        : "Unassigned"
                    }
                  />
                  <Detail label="Phone" value={client.user.phone} />
                </Details>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
