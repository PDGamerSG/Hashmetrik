import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { countAccounts, listDirectory, type DirectoryUser } from "@/lib/accounts/store";
import { listServices, listTeamMembers } from "@/lib/clients/store";
import type { Role } from "@/lib/auth/session";
import { AccountForm, ActivateForm, ManageAccount } from "@/components/admin/admin-forms";
import { Input } from "@/components/site/field";
import { deactivateUser } from "../actions";
import {
  Alert,
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
 * Everyone with an account, in one directory.
 *
 * This used to list registered users alone, which meant an administrator looking
 * for a person had to know first whether that person was staff — and there was
 * nowhere at all to find an administrator. The PRD asks for one screen covering
 * registered users, clients, team members and admins, with create, edit,
 * activate, suspend and change-role on it, and one screen is also the honest
 * answer: the four are the same table with a different value in one column.
 *
 * The filters are links rather than a client-side control, so a view is a URL
 * somebody can send to a colleague, and the whole page still works with no
 * JavaScript beyond the disclosure panels.
 */

/** The tabs, in the order the PRD names them. */
const VIEWS = [
  { key: "all", label: "Everyone" },
  { key: "registered", label: "Registered" },
  { key: "clients", label: "Clients" },
  { key: "team", label: "Team" },
  { key: "admins", label: "Admins" },
  { key: "suspended", label: "Suspended" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

function isView(value: unknown): value is ViewKey {
  return VIEWS.some((v) => v.key === value);
}

/** What each tab asks the store for. One place, so the tab and the query agree. */
function filterFor(view: ViewKey): {
  roles?: Role[];
  status?: "CLIENT" | "NON_CLIENT";
  suspended?: boolean;
} {
  switch (view) {
    case "registered":
      return { roles: ["REGISTERED_USER"], status: "NON_CLIENT" };
    case "clients":
      return { roles: ["REGISTERED_USER"], status: "CLIENT" };
    case "team":
      return { roles: ["TEAM_MEMBER"] };
    case "admins":
      return { roles: ["ADMIN"] };
    case "suspended":
      return { suspended: true };
    default:
      return {};
  }
}

const ROLE_LABEL: Record<Role, string> = {
  REGISTERED_USER: "User",
  TEAM_MEMBER: "Team",
  ADMIN: "Admin",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  const view: ViewKey = isView(params.view) ? params.view : "all";
  const q = (params.q ?? "").trim().slice(0, 80);

  let users: DirectoryUser[] = [];
  let counts: Awaited<ReturnType<typeof countAccounts>> | null = null;
  let services: { id: string; name: string }[] = [];
  let managers: { id: string; name: string }[] = [];
  let failure: string | null = null;

  try {
    const [directory, tally, serviceRows, managerRows] = await Promise.all([
      listDirectory({ ...filterFor(view), q: q || undefined }),
      countAccounts(),
      listServices(),
      listTeamMembers(),
    ]);
    users = directory;
    counts = tally;
    services = serviceRows.map((s) => ({ id: s.id, name: s.name }));
    managers = managerRows.map((m) => ({ id: m.id, name: m.user.name ?? m.user.email }));
  } catch (error) {
    console.error("[admin] accounts unavailable", error);
    failure = "The database is unreachable. Check DATABASE_URL — see docs/backend-setup.md.";
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        meta={
          counts &&
          `${counts.total} account${counts.total === 1 ? "" : "s"} · ${counts.clients} client${
            counts.clients === 1 ? "" : "s"
          } · ${counts.team} team · ${counts.admins} admin${counts.admins === 1 ? "" : "s"}${
            counts.suspended ? ` · ${counts.suspended} suspended` : ""
          }`
        }
      />

      <nav aria-label="Filter accounts" className="mt-6 flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <FilterLink
            key={v.key}
            label={`${v.label}${countFor(v.key, counts) ?? ""}`}
            href={`/admin/users?view=${v.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={view === v.key}
          />
        ))}
      </nav>

      {/* A plain GET form: the search term belongs in the URL, next to the tab
          it was run inside, so a result set can be linked to and reloaded. */}
      <form method="get" action="/admin/users" className="mt-4 flex flex-wrap items-center gap-3">
        <input type="hidden" name="view" value={view} />
        <label htmlFor="account-search" className="sr-only">
          Search accounts
        </label>
        <Input
          id="account-search"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Name, email or business"
          maxLength={80}
          className="max-w-xs"
        />
        <SubmitButton variant="quiet">Search</SubmitButton>
        {q && (
          <Link
            href={`/admin/users?view=${view}`}
            className="text-sm text-slate underline underline-offset-4 hover:text-ink"
          >
            Clear
          </Link>
        )}
      </form>

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : (
        <>
          <section className="mt-10">
            <details className="rounded-sheet border border-ash bg-bone-2 p-5 md:p-6">
              <summary className="label-sm cursor-pointer text-slate">
                Create an account
              </summary>
              <div className="mt-5 border-t border-ash pt-5">
                <AccountForm defaultRole="REGISTERED_USER" idPrefix="directory" />
              </div>
            </details>
          </section>

          {users.length === 0 ? (
            <Empty>
              {q
                ? `Nothing matches “${q}”. Try part of an email address.`
                : "No accounts in this view yet."}
            </Empty>
          ) : (
            <ul className="mt-6 space-y-4">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === admin.id}
                  services={services}
                  managers={managers}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/** The tally beside a tab, or nothing when the count would be a guess. */
function countFor(
  key: ViewKey,
  counts: Awaited<ReturnType<typeof countAccounts>> | null,
): string | null {
  if (!counts) return null;
  const value = {
    all: counts.total,
    registered: counts.registered - counts.clients,
    clients: counts.clients,
    team: counts.team,
    admins: counts.admins,
    suspended: counts.suspended,
  }[key];
  return value ? ` (${value})` : null;
}

function UserRow({
  user,
  isSelf,
  services,
  managers,
}: {
  user: DirectoryUser;
  isSelf: boolean;
  services: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  const suspended = Boolean(user.suspendedAt);
  const isClient = user.status === "CLIENT";
  /* The activation control belongs on the accounts that can actually take it:
     a registered user who is not a client yet. Offering it on a team member
     would be offering to give an employee a client dashboard. */
  const canActivate = user.role === "REGISTERED_USER" && !isClient && !suspended;

  return (
    <Card as="li">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-lg font-medium text-ink">
            {user.name ?? user.email}
            {isSelf && <span className="ml-2 text-sm font-normal text-slate">(you)</span>}
          </p>
          <p className="mt-1 text-sm text-slate">
            <a href={`mailto:${user.email}`} className="underline underline-offset-2">
              {user.email}
            </a>
            {user.phone && ` · ${user.phone}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={user.role === "ADMIN" ? "live" : "neutral"}>{ROLE_LABEL[user.role]}</Pill>
          {isClient && <Pill tone="good">Client</Pill>}
          {suspended && <Pill tone="warn">Suspended</Pill>}
        </div>
      </div>

      <Details>
        <Detail label="Business" value={user.businessName ?? user.clientProfile?.companyName} />
        <Detail label="Industry" value={user.businessType} />
        <Detail label="Job title" value={user.teamProfile?.roleTitle} />
        <Detail
          label="Accounts managed"
          value={user.teamProfile ? String(user.teamProfile._count.managedClients) : null}
        />
        <Detail label="Signed up" value={formatDate(user.createdAt)} />
        <Detail label="Suspended" value={suspended ? formatDate(user.suspendedAt) : null} />
      </Details>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <ManageAccount
          user={{
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            businessName: user.businessName,
            businessType: user.businessType,
            suspended,
          }}
          isSelf={isSelf}
        />

        {isClient && (
          <form action={deactivateUser}>
            <input type="hidden" name="userId" value={user.id} />
            <SubmitButton variant="quiet">Revoke client access</SubmitButton>
          </form>
        )}
      </div>

      {canActivate && (
        <div className="mt-4">
          <ActivateForm
            userId={user.id}
            services={services}
            managers={managers}
            defaultCompany={user.businessName ?? ""}
          />
        </div>
      )}
    </Card>
  );
}

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`label rounded-full border px-3 py-2 transition-colors ${
        active
          ? "border-ink bg-ink text-bone"
          : "border-ash text-slate hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
