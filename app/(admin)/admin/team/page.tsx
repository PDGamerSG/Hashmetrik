import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { teamPerformance } from "@/lib/clients/store";
import { listUsers } from "@/lib/accounts/store";
import { StaffForm } from "@/components/admin/admin-forms";
import {
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
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

  const [members, admins] = await Promise.all([
    teamPerformance(),
    listUsers({ role: "ADMIN" }),
  ]);

  return (
    <>
      <PageHeader
        title="Staff"
        meta={`${members.length} team · ${admins.length} administrator${admins.length === 1 ? "" : "s"}`}
      />

      <Card className="mt-8">
        <SectionTitle>Add someone</SectionTitle>
        <div className="mt-4">
          <StaffForm />
        </div>
      </Card>

      <section className="mt-10">
        <SectionTitle count={members.length}>Team</SectionTitle>
        {/* The PRD asks for "review performance". This is the honest version of
            it: the state of the accounts somebody is the named contact for.
            Deliverables record no author, so crediting individual output would
            mean crediting whoever pressed submit — a number that reads as a
            measure of a person and is not one. */}
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Measured across the accounts each person is the named contact for.
        </p>

        {members.length === 0 ? (
          <Empty>No team members yet. Add one above and they can sign in at /login.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {members.map((member) => (
              <Card as="li" key={member.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {member.user.name ?? member.user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      {member.user.email}
                      {member.roleTitle && ` · ${member.roleTitle}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {member.overdue > 0 && (
                      <Pill tone="warn">
                        {member.overdue} past its date
                      </Pill>
                    )}
                    <Pill tone="neutral">
                      on {member.assigned} account{member.assigned === 1 ? "" : "s"}
                    </Pill>
                    <Pill tone="live">
                      manages {member.clients}
                    </Pill>
                  </div>
                </div>

                <Details>
                  <Detail label="Active projects" value={String(member.activeProjects)} />
                  <Detail
                    label="Average progress"
                    value={member.averageProgress === null ? null : `${member.averageProgress}%`}
                  />
                  <Detail
                    label="Milestones"
                    value={
                      member.milestonesTotal === 0
                        ? null
                        : `${member.milestonesDone} of ${member.milestonesTotal}`
                    }
                  />
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
      </section>

      <section className="mt-10">
        <SectionTitle count={admins.length}>Administrators</SectionTitle>
        <ul className="mt-4 space-y-3">
          {admins.map((admin) => (
            <Card as="li" key={admin.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink">{admin.name ?? admin.email}</p>
                <p className="text-sm text-slate">{admin.email}</p>
              </div>
            </Card>
          ))}
        </ul>
      </section>
    </>
  );
}
