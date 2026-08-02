import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { listUsers } from "@/lib/accounts/store";
import { listServices, listTeamMembers } from "@/lib/clients/store";
import { ActivateForm } from "@/components/admin/admin-forms";
import { deactivateUser } from "../actions";
import {
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  SubmitButton,
  formatDate,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Accounts" };
export const dynamic = "force-dynamic";

/**
 * Everyone who has signed up.
 *
 * The only action here is the one that matters: turning a registered account
 * into a client. Editing somebody else's profile is deliberately absent — they
 * can do it themselves, and an admin screen that can rewrite anybody's details
 * is a support incident waiting to happen.
 */
export default async function AdminUsersPage() {
  await requireAdmin();

  const [users, services, managers] = await Promise.all([
    listUsers({ role: "REGISTERED_USER" }),
    listServices(),
    listTeamMembers(),
  ]);

  const clients = users.filter((u) => u.status === "CLIENT");
  const prospects = users.filter((u) => u.status !== "CLIENT");

  const serviceOptions = services.map((s) => ({ id: s.id, name: s.name }));
  const managerOptions = managers.map((m) => ({
    id: m.id,
    name: m.user.name ?? m.user.email,
  }));

  return (
    <>
      <PageHeader
        title="Accounts"
        meta={`${users.length} registered · ${clients.length} client${clients.length === 1 ? "" : "s"}`}
      />

      <section className="mt-8">
        <h2 className="label-sm text-slate">Not yet clients ({prospects.length})</h2>
        {prospects.length === 0 ? (
          <Empty>Everyone who has signed up is already a client.</Empty>
        ) : (
          <ul className="mt-4 space-y-4">
            {prospects.map((user) => (
              <Card as="li" key={user.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-medium text-ink">
                      {user.name ?? user.email}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      <a href={`mailto:${user.email}`} className="underline underline-offset-2">
                        {user.email}
                      </a>
                      {user.phone && ` · ${user.phone}`}
                    </p>
                  </div>
                  <ActivateForm
                    userId={user.id}
                    services={serviceOptions}
                    managers={managerOptions}
                    defaultCompany={user.businessName ?? ""}
                  />
                </div>

                <Details>
                  <Detail label="Business" value={user.businessName} />
                  <Detail label="Industry" value={user.businessType} />
                  <Detail label="Signed up" value={formatDate(user.createdAt)} />
                </Details>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="label-sm text-slate">Clients ({clients.length})</h2>
        {clients.length === 0 ? (
          <Empty>No clients yet.</Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {clients.map((user) => (
              <Card as="li" key={user.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{user.name ?? user.email}</p>
                    <p className="mt-1 text-sm text-slate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Pill tone="good">Client</Pill>
                    <form action={deactivateUser}>
                      <input type="hidden" name="userId" value={user.id} />
                      <SubmitButton variant="quiet">Revoke access</SubmitButton>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
