import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
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
  Filter,
  Filters,
  PageHeader,
  Pill,
  SubmitButton,
  formatCount,
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
          `${formatCount(counts.total)} account${counts.total === 1 ? "" : "s"} · ${formatCount(counts.clients)} client${
            counts.clients === 1 ? "" : "s"
          } · ${formatCount(counts.team)} team · ${formatCount(counts.admins)} admin${counts.admins === 1 ? "" : "s"}${
            counts.suspended ? ` · ${counts.suspended} suspended` : ""
          }`
        }
      />

      <Filters label="Filter accounts">
        {VIEWS.map((v) => (
          <Filter
            key={v.key}
            label={v.label}
            count={countFor(v.key, counts)}
            href={`/admin/users?view=${v.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            active={view === v.key}
          />
        ))}
      </Filters>

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
          {/* Closed by default: this page is read far more often than it is
              written to, and a create form standing open above the directory is
              a form somebody eventually fills in by mistake. */}
          <details className="group mt-10 rounded-sheet border border-ash bg-bone-2 open:bg-bone-2">
            <summary className="label-sm flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 text-slate transition-colors hover:text-ink md:px-6">
              <Plus
                aria-hidden
                className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-quint)] group-open:rotate-45"
              />
              Create an account
            </summary>
            <div className="border-t border-ash px-5 py-5 md:px-6">
              <AccountForm defaultRole="REGISTERED_USER" idPrefix="directory" />
            </div>
          </details>

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
): number | undefined {
  if (!counts) return undefined;
  return {
    all: counts.total,
    registered: counts.registered - counts.clients,
    clients: counts.clients,
    team: counts.team,
    admins: counts.admins,
    suspended: counts.suspended,
  }[key];
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
    <Card as="li" className="transition-colors hover:border-ink/25">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-display text-lg leading-tight font-medium text-ink">
              {user.name ?? user.email}
            </p>
            {isSelf && <span className="label-xs text-slate">You</span>}
          </div>
          <p className="mt-2 text-sm text-slate">
            <a
              href={`mailto:${user.email}`}
              className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
            >
              {user.email}
            </a>
            {user.phone && ` · ${user.phone}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {suspended && <Pill tone="warn" dot>Suspended</Pill>}
          {isClient && <Pill tone="good" dot>Client</Pill>}
          <Pill tone={user.role === "ADMIN" ? "live" : "neutral"}>{ROLE_LABEL[user.role]}</Pill>
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
