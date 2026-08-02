import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { CONSULTATION_STATUSES, listConsultations } from "@/lib/consultations/store";
import { updateConsultation } from "../actions";
import { Textarea } from "@/components/site/field";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  SubmitButton,
  formatDate,
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

  return (
    <>
      <PageHeader
        title="Consultations"
        meta={`${consultations.length} shown · ${open} awaiting a time`}
      />

      <nav aria-label="Filter consultations" className="mt-6 flex flex-wrap gap-2">
        <Filter label="All" href="/admin/consultations" active={!status} />
        {CONSULTATION_STATUSES.map((s) => (
          <Filter
            key={s}
            label={s}
            href={`/admin/consultations?status=${s}`}
            active={status === s}
          />
        ))}
      </nav>

      {consultations.length === 0 ? (
        <Empty>
          Nothing here. Requests from the dashboard and calls raised from a lead both land on this
          page.
        </Empty>
      ) : (
        <ul className="mt-8 space-y-4">
          {consultations.map((c) => {
            const person = c.user ?? c.lead;
            return (
              <Card as="li" key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-medium text-ink">
                      {person?.name ?? "Unknown"}
                    </p>
                    <p className="mt-1 text-sm text-slate">
                      {person?.email && (
                        <a href={`mailto:${person.email}`} className="underline underline-offset-2">
                          {person.email}
                        </a>
                      )}
                      {c.user?.phone && ` · ${c.user.phone}`}
                      {" · asked "}
                      {formatDate(c.createdAt)}
                    </p>
                    {c.topic && <p className="mt-2 text-sm text-ink">{c.topic}</p>}
                    {c.lead?.service && (
                      <p className="mt-1 text-sm text-slate">Interested in {c.lead.service}</p>
                    )}
                  </div>
                  <Pill tone={TONE[c.status] ?? "neutral"}>{c.status}</Pill>
                </div>

                {/* Status, time and notes are one form: they are decided in the
                    same moment, and separate buttons is how a consultation ends
                    up marked scheduled with no time on it. */}
                <form action={updateConsultation} className="mt-4 space-y-3 border-t border-ash pt-4">
                  <input type="hidden" name="id" value={c.id} />

                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label htmlFor={`st-${c.id}`} className="label-sm text-slate">
                        Status
                      </label>
                      <select
                        id={`st-${c.id}`}
                        name="status"
                        defaultValue={c.status}
                        className="mt-2 h-10 rounded-sheet border border-ash bg-bone-2 px-3 text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
                      >
                        {CONSULTATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`at-${c.id}`} className="label-sm text-slate">
                        Scheduled for
                      </label>
                      <input
                        id={`at-${c.id}`}
                        name="scheduledAt"
                        type="datetime-local"
                        defaultValue={toLocalInput(c.scheduledAt)}
                        className="mt-2 h-10 rounded-sheet border border-ash bg-bone-2 px-3 text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
                      />
                    </div>

                    <SubmitButton>Save</SubmitButton>
                  </div>

                  <div>
                    <label htmlFor={`nt-${c.id}`} className="label-sm text-slate">
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
                </form>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Filter({ label, href, active }: { label: string; href: string; active: boolean }) {
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
