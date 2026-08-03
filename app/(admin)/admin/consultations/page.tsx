import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { CONSULTATION_STATUSES, listConsultations } from "@/lib/consultations/store";
import { updateConsultation } from "../actions";
import { Textarea } from "@/components/site/field";
import {
  Card,
  Empty,
  Fieldset,
  Filter,
  Filters,
  Input,
  PageHeader,
  Pill,
  Select,
  SubmitButton,
  formatDate,
  formatDateTime,
  toLocalInput,
  type Tone,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Consultations" };
export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = {
  requested: "warn",
  scheduled: "live",
  completed: "done",
  cancelled: "done",
};

export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = CONSULTATION_STATUSES.find((s) => s === params.status);

  const consultations = await listConsultations({ status });
  const open = consultations.filter((c) => c.status === "requested").length;

  /* The next call that actually has a time on it. A page about calls that does
     not say when the next one is makes you read every row to find out. */
  const next = consultations
    .filter((c) => c.status === "scheduled" && c.scheduledAt)
    .sort((a, b) => Number(a.scheduledAt) - Number(b.scheduledAt))[0];

  return (
    <>
      <PageHeader
        title="Consultations"
        meta={
          consultations.length === 0
            ? "Requests from the dashboard and calls raised from a lead both land here."
            : [
                `${consultations.length} shown`,
                open > 0 ? `${open} awaiting a time` : "all have a time",
                next ? `next ${formatDateTime(next.scheduledAt)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")
        }
      />

      <Filters label="Filter consultations">
        <Filter label="All" href="/admin/consultations" active={!status} />
        {CONSULTATION_STATUSES.map((s) => (
          <Filter
            key={s}
            label={s}
            href={`/admin/consultations?status=${s}`}
            active={status === s}
          />
        ))}
      </Filters>

      {consultations.length === 0 ? (
        <Empty>
          Nothing here. Requests from the dashboard and calls raised from a lead both land on this
          page.
        </Empty>
      ) : (
        <ul className="mt-8 space-y-5">
          {consultations.map((c) => {
            const person = c.user ?? c.lead;
            return (
              <Card as="li" key={c.id} className="transition-colors hover:border-ink/25">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-display text-lg leading-tight font-medium text-ink">
                        {person?.name ?? "Unknown"}
                      </p>
                      <Pill tone={TONE[c.status] ?? "neutral"} dot>
                        {c.status}
                      </Pill>
                    </div>

                    <p className="mt-2 text-sm text-slate">
                      {person?.email && (
                        <a
                          href={`mailto:${person.email}`}
                          className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                        >
                          {person.email}
                        </a>
                      )}
                      {c.user?.phone && ` · ${c.user.phone}`}
                    </p>

                    {c.topic && <p className="mt-3 text-sm leading-relaxed text-ink">{c.topic}</p>}
                    {c.lead?.service && (
                      <p className="mt-1 text-sm text-slate">Interested in {c.lead.service}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="label-xs text-slate">Asked</p>
                    <p className="tabular mt-1 text-sm text-ink">{formatDate(c.createdAt)}</p>
                  </div>
                </div>

                {/* Status, time and notes are one form: they are decided in the
                    same moment, and separate buttons is how a consultation ends
                    up marked scheduled with no time on it. */}
                <form action={updateConsultation}>
                  <input type="hidden" name="id" value={c.id} />

                  <Fieldset legend="The call">
                    <div className="mt-3 grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end">
                      <Select
                        id={`st-${c.id}`}
                        name="status"
                        label="Status"
                        defaultValue={c.status}
                      >
                        {CONSULTATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>

                      <Input
                        id={`at-${c.id}`}
                        name="scheduledAt"
                        label="Scheduled for"
                        type="datetime-local"
                        defaultValue={toLocalInput(c.scheduledAt)}
                      />

                      <SubmitButton busyLabel="Saving…">Save</SubmitButton>
                    </div>

                    <div className="mt-4">
                      <label htmlFor={`nt-${c.id}`} className="label-xs block text-slate">
                        Notes
                      </label>
                      <Textarea
                        id={`nt-${c.id}`}
                        name="notes"
                        rows={2}
                        defaultValue={c.notes ?? ""}
                        maxLength={2000}
                        className="mt-2"
                      />
                    </div>
                  </Fieldset>
                </form>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
