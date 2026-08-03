import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/dal";
import { teamPerformance } from "@/lib/clients/store";
import { listUsers } from "@/lib/accounts/store";
import { StaffForm } from "@/components/admin/admin-forms";
import {
  Card,
  Detail,
  Details,
  Empty,
  Meter,
  PageHeader,
  Pill,
  Row,
  Rows,
  Section,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Staff" };
export const dynamic = "force-dynamic";

/**
 * Staff accounts.
 *
 * Made here and nowhere else: there is no signup route that can produce one and
 * no way to promote an existing account through the interface. The seed script
 * is the only other door, and it needs the database URL.
 */
export default async function AdminTeamPage() {
  await requireAdmin();

  const [members, admins] = await Promise.all([teamPerformance(), listUsers({ role: "ADMIN" })]);

  const overdue = members.reduce((sum, member) => sum + member.overdue, 0);

  return (
    <>
      <PageHeader
        title="Staff"
        meta={
          `${members.length} team · ${admins.length} administrator${admins.length === 1 ? "" : "s"}` +
          (overdue > 0 ? ` · ${overdue} deliverable${overdue === 1 ? "" : "s"} past its date` : "")
        }
      />

      <details className="group mt-8 rounded-sheet border border-ash bg-bone-2">
        <summary className="label-sm flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 text-slate transition-colors hover:text-ink md:px-6">
          <Plus
            aria-hidden
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-quint)] group-open:rotate-45"
          />
          Add someone
        </summary>
        <div className="border-t border-ash px-5 py-5 md:px-6">
          <StaffForm />
        </div>
      </details>

      {/* The PRD asks for "review performance". This is the honest version of
          it: the state of the accounts somebody is the named contact for.
          Deliverables record no author, so crediting individual output would
          mean crediting whoever pressed submit — a number that reads as a
          measure of a person and is not one. */}
      <Section title="Team" count={members.length}>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate">
          Measured across the accounts each person is the named contact for.
        </p>

        {members.length === 0 ? (
          <Empty>No team members yet. Add one above and they can sign in at /login.</Empty>
        ) : (
          <ul className="mt-5 space-y-4">
            {members.map((member) => (
              <Card as="li" key={member.id} className="transition-colors hover:border-ink/25">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight font-medium text-ink">
                      {member.user.name ?? member.user.email}
                    </p>
                    <p className="mt-1.5 text-sm text-slate">
                      {member.user.email}
                      {member.roleTitle && ` · ${member.roleTitle}`}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {member.overdue > 0 && (
                      <Pill tone="warn" dot>
                        {member.overdue} past its date
                      </Pill>
                    )}
                    <Pill tone="live">manages {member.clients}</Pill>
                    <Pill tone="neutral">
                      on {member.assigned} account{member.assigned === 1 ? "" : "s"}
                    </Pill>
                  </div>
                </div>

                {/* The two proportions worth seeing side by side. A percentage
                    on its own line is a figure you compare by memory; a bar is
                    one you compare by looking. */}
                {(member.averageProgress !== null || member.milestonesTotal > 0) && (
                  <div className="mt-5 grid gap-x-10 gap-y-4 border-t border-ash pt-4 sm:grid-cols-2">
                    {member.averageProgress !== null && (
                      <Meter
                        label="Average progress"
                        value={member.averageProgress}
                        display={`${member.averageProgress}%`}
                      />
                    )}
                    {member.milestonesTotal > 0 && (
                      <Meter
                        label="Milestones done"
                        value={member.milestonesDone}
                        max={member.milestonesTotal}
                        display={`${member.milestonesDone} of ${member.milestonesTotal}`}
                      />
                    )}
                  </div>
                )}

                <Details>
                  <Detail label="Active projects" value={String(member.activeProjects)} />
                  <Detail label="Approved" value={String(member.approved)} />
                  <Detail
                    label="Waiting on the client"
                    value={String(member.awaitingClient + member.calendarPending)}
                  />
                  <Detail
                    label="Changes requested"
                    value={member.changesRequested === 0 ? null : String(member.changesRequested)}
                  />
                </Details>
              </Card>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Administrators" count={admins.length}>
        <Rows>
          {admins.map((admin) => (
            <Row
              key={admin.id}
              title={admin.name ?? admin.email}
              subtitle={admin.email}
              status={<Pill tone="live">Admin</Pill>}
            />
          ))}
        </Rows>
      </Section>
    </>
  );
}
