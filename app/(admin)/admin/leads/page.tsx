import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { countLeadsByStatus, listLeads } from "@/lib/leads/store";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  isLeadStatus,
  type LeadStatus,
} from "@/lib/leads/schema";
import { matchLeadToAccount, updateLeadStatus } from "../actions";
import {
  Alert,
  Card,
  Detail,
  Details,
  Empty,
  Fieldset,
  Filter,
  Filters,
  PageHeader,
  Pill,
  Select,
  SubmitButton,
  formatCount,
  formatDateTime,
} from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

/**
 * The leads queue.
 *
 * One page, one list, newest first. Everything a person does here is a plain
 * form post to a server action, so the whole thing works without client
 * JavaScript and there is no state to keep in sync.
 */

/* The pipeline drawn as one measured strip: how much of the business is where.
   The fills are meanings rather than a palette — coral is the stage that decays
   if nobody calls today, gold is the stage that paid, ash is the one that
   ended, and the ink ramp between them is distance travelled. */
const STAGE_FILL: Record<LeadStatus, string> = {
  new: "bg-lamp-coral",
  qualified: "bg-ink/85",
  consultation: "bg-ink/70",
  proposal: "bg-ink/55",
  negotiation: "bg-ink/40",
  client: "bg-lamp-gold",
  lost: "bg-ash",
};

const STAGE_TONE: Record<LeadStatus, "warn" | "live" | "good" | "done"> = {
  new: "warn",
  qualified: "live",
  consultation: "live",
  proposal: "live",
  negotiation: "live",
  client: "good",
  lost: "done",
};

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
  const open = LEAD_STATUSES.filter((s) => s !== "client" && s !== "lost").reduce(
    (sum, s) => sum + (counts[s] ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Leads"
        meta={
          total === 0
            ? "Every booking and contact submission lands here."
            : `${formatCount(open)} still open of ${formatCount(total)} · ${formatCount(counts.new ?? 0)} not yet opened`
        }
      />

      {total > 0 && (
        /* The pipeline in the order the PRD names it rather than sorted by
           volume: the point of a pipeline is that it is a sequence, and a board
           that reorders itself as the numbers move cannot be read at a glance
           twice running. */
        <div className="mt-8 flex h-2 w-full gap-px overflow-hidden rounded-full bg-ash">
          {LEAD_STATUSES.map((s) =>
            counts[s] ? (
              <div
                key={s}
                className={cn("h-full first:rounded-l-full last:rounded-r-full", STAGE_FILL[s])}
                style={{ width: `${((counts[s] ?? 0) / total) * 100}%` }}
                title={`${LEAD_STATUS_LABELS[s]}: ${counts[s]}`}
              />
            ) : null,
          )}
        </div>
      )}

      <Filters label="Filter leads">
        <Filter label="All" href="/admin/leads" active={!status && !kind} count={total} />
        {LEAD_STATUSES.map((s) => (
          <Filter
            key={s}
            label={LEAD_STATUS_LABELS[s]}
            count={counts[s] ?? 0}
            href={`/admin/leads?status=${s}`}
            active={status === s}
          />
        ))}
        <Filter label="Bookings" href="/admin/leads?kind=booking" active={kind === "booking"} />
        <Filter label="Contact" href="/admin/leads?kind=contact" active={kind === "contact"} />
      </Filters>

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : leads.length === 0 ? (
        <Empty>
          {status || kind
            ? "No leads in this view. Clear the filter to see the whole queue."
            : "Nothing here yet. Every booking and contact submission lands on this page."}
        </Empty>
      ) : (
        <ul className="mt-8 space-y-5">
          {leads.map((lead) => {
            const stage = isLeadStatus(lead.status) ? lead.status : "new";

            return (
              <Card as="li" key={lead.id} className="transition-colors hover:border-ink/25">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-display text-xl leading-tight font-medium text-ink">
                        {lead.name}
                      </p>
                      <Pill tone={STAGE_TONE[stage]} dot>
                        {LEAD_STATUS_LABELS[stage]}
                      </Pill>
                      {!lead.notifiedAt && <Pill tone="warn">Not emailed</Pill>}
                      {lead.userId && <Pill tone="neutral">Has an account</Pill>}
                    </div>

                    <p className="mt-2 text-sm text-slate">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                      >
                        {lead.email}
                      </a>
                      {lead.phone && (
                        <>
                          {" · "}
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                          >
                            {lead.phone}
                          </a>
                        </>
                      )}
                      {lead.company && ` · ${lead.company}`}
                    </p>
                  </div>

                  <p className="label-xs shrink-0 text-slate">
                    {lead.kind === "booking" ? "Booking" : "Contact"} ·{" "}
                    <time dateTime={lead.createdAt.toISOString()} className="tabular">
                      {formatDateTime(lead.createdAt)}
                    </time>
                  </p>
                </div>

                <Details>
                  <Detail label="Service" value={lead.service} />
                  <Detail label="Budget" value={lead.budget} />
                  <Detail
                    label="Preferred"
                    value={
                      [lead.preferredDate, lead.preferredTime].filter(Boolean).join(" · ") || null
                    }
                  />
                  <Detail label="Website" value={lead.website} />
                  <Detail label="Industry" value={lead.industry} />
                </Details>

                {lead.message && (
                  /* What they actually wrote, set as reading matter rather than
                     as one more field: it is the only part of a lead that did
                     not come out of a dropdown. */
                  <blockquote className="mt-5 border-l border-ash pl-4 text-sm leading-relaxed text-ink">
                    {lead.message}
                  </blockquote>
                )}

                <Fieldset legend="Stage">
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <form action={updateLeadStatus} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={lead.id} />
                      <Select
                        id={`status-${lead.id}`}
                        name="status"
                        label="Status"
                        hideLabel
                        defaultValue={lead.status}
                        className="w-44"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {LEAD_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </Select>
                      <SubmitButton size="sm" busyLabel="Saving…">
                        Save stage
                      </SubmitButton>
                    </form>

                    {!lead.userId && (
                      /* One press rather than a search: the address on the
                         enquiry is almost always the address on the account, and
                         matching them is what stops the pipeline carrying the
                         same person twice. */
                      <form action={matchLeadToAccount}>
                        <input type="hidden" name="leadId" value={lead.id} />
                        <input type="hidden" name="email" value={lead.email} />
                        <SubmitButton variant="quiet" size="sm" busyLabel="Matching…">
                          Match to this email
                        </SubmitButton>
                      </form>
                    )}
                  </div>
                </Fieldset>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
