import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { listTeamMembers } from "@/lib/clients/store";
import { listUsers } from "@/lib/accounts/store";
import { StaffForm } from "@/components/admin/admin-forms";
import { Card, Empty, PageHeader, Pill, SectionTitle } from "@/components/app/ui";

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
    listTeamMembers(),
    listUsers({ role: "ADMIN" }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
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
                  <Pill tone="live">
                    {member._count.managedClients} account
                    {member._count.managedClients === 1 ? "" : "s"}
                  </Pill>
                </div>
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
