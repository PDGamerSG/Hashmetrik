import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/dal";
import { listCalendar } from "@/lib/calendar/store";
import { CalendarDecision } from "@/components/app/client-forms";
import { safeUrl } from "@/lib/url";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Section,
  formatDate,
  type Tone,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Content calendar" };
export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = {
  pending: "warn",
  approved: "good",
  changes_requested: "warn",
};

const LABEL: Record<string, string> = {
  pending: "Waiting on you",
  approved: "Approved",
  changes_requested: "Changes requested",
};

/** Groups by month, because that is the unit a content plan is discussed in. */
function monthOf(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date);
}

export default async function ClientCalendarPage() {
  const { client } = await requireClient();
  const entries = await listCalendar(client.id);

  const waiting = entries.filter((e) => e.approvalStatus === "pending").length;

  const months = entries.reduce<Map<string, typeof entries>>((acc, entry) => {
    const key = monthOf(entry.publishDate);
    const bucket = acc.get(key);
    if (bucket) bucket.push(entry);
    else acc.set(key, [entry]);
    return acc;
  }, new Map());

  return (
    <>
      <PageHeader
        title="Content calendar"
        meta={
          waiting > 0
            ? `${waiting} post${waiting === 1 ? "" : "s"} waiting on your approval`
            : "Everything planned is approved"
        }
      />

      {entries.length === 0 ? (
        <Empty>Nothing planned yet. Posts appear here for approval before they go out.</Empty>
      ) : (
        <>
          <Readouts className="lg:grid-cols-3">
            <Readout
              label="Waiting on you"
              value={waiting}
              note="Approve or ask for changes"
              urgent
            />
            <Readout
              label="Approved"
              value={entries.filter((e) => e.approvalStatus === "approved").length}
              note="Cleared to publish"
            />
            <Readout label="Planned" value={entries.length} note="Posts on the calendar" />
          </Readouts>

          {[...months.entries()].map(([month, group]) => (
          <Section key={month} title={month} count={group.length}>
            <ul className="mt-5 space-y-4">
              {group.map((entry) => (
                <Card as="li" key={entry.id}>
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0">
                      <p className="label-xs text-slate">
                        {entry.platform} ·{" "}
                        <span className="tabular">{formatDate(entry.publishDate)}</span>
                      </p>
                      {entry.caption && (
                        /* The caption is the thing being approved, so it is set
                           as copy at reading size rather than as a field value
                           under a heading. */
                        <p className="mt-3 max-w-prose text-[15px] leading-relaxed whitespace-pre-wrap text-ink">
                          {entry.caption}
                        </p>
                      )}
                    </div>
                    <Pill tone={TONE[entry.approvalStatus] ?? "neutral"} dot>
                      {LABEL[entry.approvalStatus] ?? entry.approvalStatus}
                    </Pill>
                  </div>

                  {/* Checked again here, not only on the way in: a row stored
                      before that check existed would otherwise still render a
                      `javascript:` link straight at the client. */}
                  {safeUrl(entry.creativeUrl) && (
                    <a
                      href={safeUrl(entry.creativeUrl) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-sm text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                    >
                      See the creative
                    </a>
                  )}

                  {entry.note && (
                    <p className="mt-4 border-l border-ash pl-4 text-sm leading-relaxed text-slate">
                      Your note: {entry.note}
                    </p>
                  )}

                  <div className="mt-5 border-t border-ash pt-5">
                    <CalendarDecision id={entry.id} status={entry.approvalStatus} />
                  </div>
                </Card>
              ))}
            </ul>
          </Section>
          ))}
        </>
      )}
    </>
  );
}
