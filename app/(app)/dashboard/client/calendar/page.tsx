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
  SectionTitle,
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
        [...months.entries()].map(([month, group]) => (
          <section key={month} className="mt-10">
            <SectionTitle count={group.length}>{month}</SectionTitle>
            <ul className="mt-4 space-y-4">
              {group.map((entry) => (
                <Card as="li" key={entry.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="label-sm text-slate">
                        {entry.platform} · {formatDate(entry.publishDate)}
                      </p>
                      {entry.caption && (
                        <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                          {entry.caption}
                        </p>
                      )}
                    </div>
                    <Pill tone={TONE[entry.approvalStatus] ?? "neutral"}>
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
                      className="mt-3 inline-block text-sm text-ink underline underline-offset-2"
                    >
                      See the creative
                    </a>
                  )}

                  {entry.note && (
                    <p className="mt-3 border-l-2 border-ash pl-3 text-sm text-slate">
                      Your note: {entry.note}
                    </p>
                  )}

                  <div className="mt-4 border-t border-ash pt-4">
                    <CalendarDecision id={entry.id} status={entry.approvalStatus} />
                  </div>
                </Card>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
