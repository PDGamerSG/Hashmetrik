import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { countLeadsByStatus, listLeads } from "@/lib/leads/store";
import { LEAD_STATUSES, isLeadStatus } from "@/lib/leads/schema";
import { logout, updateLeadStatus } from "./actions";

export const metadata: Metadata = {
  title: "Leads — HashMetrik",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The leads queue.
 *
 * One page, one table, sorted newest first. Everything a person does here is a
 * plain form post to a server action, so the whole thing works without client
 * JavaScript and there is no state to keep in sync.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  const session = await verifySession();
  const params = await searchParams;

  const status = isLeadStatus(params.status) ? params.status : undefined;
  const kind = params.kind === "booking" || params.kind === "contact" ? params.kind : undefined;

  /* One failure mode worth handling rather than crashing: no database. It is
     the state the project is in until DATABASE_URL points somewhere real, and a
     stack trace is a poor way to say so. */
  let leads: Awaited<ReturnType<typeof listLeads>> = [];
  let counts: Record<string, number> = {};
  let failure: string | null = null;
  try {
    [leads, counts] = await Promise.all([listLeads({ status, kind }), countLeadsByStatus()]);
  } catch (error) {
    console.error("[admin] leads unavailable", error);
    failure = "The database is unreachable. Check DATABASE_URL — see docs/backend-setup.md.";
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <main className="flex-1 px-6 py-10 md:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ash pb-6">
        <div>
          <p className="label-sm text-slate">HashMetrik</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
            Leads
          </h1>
          <p className="mt-2 text-sm text-slate">
            {total} in total{status || kind ? ` · ${leads.length} shown` : ""} · signed in as{" "}
            {session.email}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="h-10 rounded-sheet border border-ash px-4 text-[13px] text-ink transition-colors hover:border-ink hover:bg-bone-2"
          >
            Sign out
          </button>
        </form>
      </header>

      <nav aria-label="Filter leads" className="mt-6 flex flex-wrap gap-2">
        <FilterLink label="All" href="/admin" active={!status && !kind} />
        {LEAD_STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={`${s}${counts[s] ? ` (${counts[s]})` : ""}`}
            href={`/admin?status=${s}`}
            active={status === s}
          />
        ))}
        <FilterLink label="Bookings" href="/admin?kind=booking" active={kind === "booking"} />
        <FilterLink label="Contact" href="/admin?kind=contact" active={kind === "contact"} />
      </nav>

      {failure ? (
        <p role="alert" className="mt-10 border-l-2 border-coral pl-4 text-sm text-slate">
          {failure}
        </p>
      ) : leads.length === 0 ? (
        <p className="mt-10 text-sm text-slate">
          Nothing here yet. Every booking and contact submission lands on this page.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-sheet border border-ash bg-bone-2 p-5 md:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-sm text-slate">
                    {lead.kind === "booking" ? "Booking" : "Contact"} ·{" "}
                    <time dateTime={lead.createdAt.toISOString()}>
                      {formatDate(lead.createdAt)}
                    </time>
                    {!lead.notifiedAt && " · not emailed"}
                  </p>
                  <p className="mt-2 font-display text-xl font-medium text-ink">{lead.name}</p>
                  <p className="mt-1 text-sm text-slate">
                    <a href={`mailto:${lead.email}`} className="underline underline-offset-2">
                      {lead.email}
                    </a>
                    {lead.phone && (
                      <>
                        {" · "}
                        <a href={`tel:${lead.phone}`} className="underline underline-offset-2">
                          {lead.phone}
                        </a>
                      </>
                    )}
                    {lead.company && ` · ${lead.company}`}
                  </p>
                </div>

                <form action={updateLeadStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={lead.id} />
                  <label htmlFor={`status-${lead.id}`} className="sr-only">
                    Status
                  </label>
                  <select
                    id={`status-${lead.id}`}
                    name="status"
                    defaultValue={lead.status}
                    className="h-10 rounded-sheet border border-ash bg-bone px-3 text-sm text-ink"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-10 rounded-sheet bg-ink px-4 text-[13px] text-bone transition-colors hover:bg-coral hover:text-ink"
                  >
                    Save
                  </button>
                </form>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ash pt-4 sm:grid-cols-4">
                <Detail label="Service" value={lead.service} />
                <Detail label="Budget" value={lead.budget} />
                <Detail label="Preferred" value={joinDateTime(lead.preferredDate, lead.preferredTime)} />
                <Detail label="Website" value={lead.website} />
                <Detail label="Industry" value={lead.industry} />
                <Detail label="Status" value={lead.status} />
              </dl>

              {lead.message && (
                <p className="mt-4 border-t border-ash pt-4 text-sm leading-relaxed text-ink">
                  {lead.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
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

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="label-sm text-slate">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink">{value}</dd>
    </div>
  );
}

function joinDateTime(date: string | null, time: string | null): string | null {
  return [date, time].filter(Boolean).join(" · ") || null;
}

/* Fixed to en-GB rather than the server's locale: the team is in Hyderabad and
   a date that renders as month-first on one deploy and day-first on another is
   a date nobody can trust. */
function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
