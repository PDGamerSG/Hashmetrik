import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { countLeadsByStatus, listLeads } from "@/lib/leads/store";
import { LEAD_STATUSES, isLeadStatus } from "@/lib/leads/schema";
import { matchLeadToAccount, updateLeadStatus } from "../actions";
import {
  Alert,
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  SubmitButton,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

/**
 * The leads queue.
 *
 * One page, one list, newest first. Everything a person does here is a plain
 * form post to a server action, so the whole thing works without client
 * JavaScript and there is no state to keep in sync.
 */
export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const status = isLeadStatus(params.status) ? params.status : undefined;
  const kind = params.kind === "booking" || params.kind === "contact" ? params.kind : undefined;

  /* One failure mode worth handling rather than crashing: no database. A stack
     trace is a poor way to say the connection string is wrong. */
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
    <>
      <PageHeader
        title="Leads"
        meta={`${total} in total${status || kind ? ` · ${leads.length} shown` : ""}`}
      />

      <nav aria-label="Filter leads" className="mt-6 flex flex-wrap gap-2">
        <FilterLink label="All" href="/admin/leads" active={!status && !kind} />
        {LEAD_STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={`${s}${counts[s] ? ` (${counts[s]})` : ""}`}
            href={`/admin/leads?status=${s}`}
            active={status === s}
          />
        ))}
        <FilterLink label="Bookings" href="/admin/leads?kind=booking" active={kind === "booking"} />
        <FilterLink label="Contact" href="/admin/leads?kind=contact" active={kind === "contact"} />
      </nav>

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : leads.length === 0 ? (
        <Empty>Nothing here yet. Every booking and contact submission lands on this page.</Empty>
      ) : (
        <ul className="mt-8 space-y-4">
          {leads.map((lead) => (
            <Card as="li" key={lead.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="label-sm text-slate">
                    {lead.kind === "booking" ? "Booking" : "Contact"} ·{" "}
                    <time dateTime={lead.createdAt.toISOString()}>
                      {formatDateTime(lead.createdAt)}
                    </time>
                    {!lead.notifiedAt && " · not emailed"}
                    {lead.userId && " · has an account"}
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
                    className="h-10 rounded-sheet border border-ash bg-bone-2 px-3 text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <SubmitButton>Save</SubmitButton>
                </form>
              </div>

              <Details>
                <Detail label="Service" value={lead.service} />
                <Detail label="Budget" value={lead.budget} />
                <Detail
                  label="Preferred"
                  value={[lead.preferredDate, lead.preferredTime].filter(Boolean).join(" · ") || null}
                />
                <Detail label="Website" value={lead.website} />
                <Detail label="Industry" value={lead.industry} />
                <Detail label="Status" value={lead.status} />
              </Details>

              {lead.message && (
                <p className="mt-4 border-t border-ash pt-4 text-sm leading-relaxed text-ink">
                  {lead.message}
                </p>
              )}

              {!lead.userId && (
                /* One click rather than a search: the address on the enquiry is
                   almost always the address on the account, and matching them is
                   what stops the pipeline carrying a duplicate person. */
                <form action={matchLeadToAccount} className="mt-4 border-t border-ash pt-4">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="email" value={lead.email} />
                  <SubmitButton variant="quiet">Match to an account with this email</SubmitButton>
                </form>
              )}
            </Card>
          ))}
        </ul>
      )}
    </>
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
