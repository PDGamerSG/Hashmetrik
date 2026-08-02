import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";
import { listNotifications } from "@/lib/notifications/store";
import { readAllNotifications, readNotification } from "../actions";
import {
  ButtonLink,
  Card,
  Empty,
  PageHeader,
  SubmitButton,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Notices" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const viewer = await verifySession();
  const notices = await listNotifications(viewer.id);
  const unread = notices.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notices"
        meta={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          unread > 0 ? (
            <form action={readAllNotifications}>
              <SubmitButton variant="quiet" busyLabel="Marking…">
                Mark all read
              </SubmitButton>
            </form>
          ) : null
        }
      />

      {notices.length === 0 ? (
        <Empty>
          Nothing yet. Approvals, scheduled calls and project updates all land here.
        </Empty>
      ) : (
        <ul className="mt-8 space-y-3">
          {notices.map((notice) => (
            <Card as="li" key={notice.id} className={notice.readAt ? "opacity-60" : undefined}>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                <div className="flex min-w-0 flex-1 items-baseline gap-3">
                  {/* Unread is one coral tick at the head of the row — the same
                      mark the tick rule is made of. It replaces the coloured
                      slab down the card's left edge, which at 2px was the
                      loudest thing in a list where most rows are already read. */}
                  <span
                    aria-hidden
                    className={`mt-1.5 h-2.5 w-px shrink-0 ${notice.readAt ? "bg-transparent" : "bg-coral"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm leading-relaxed text-ink">
                      {notice.message}
                      {!notice.readAt && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="mt-1 text-xs text-slate">{formatDateTime(notice.createdAt)}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {notice.href && (
                    <ButtonLink href={notice.href} variant="quiet" size="sm">
                      Open
                    </ButtonLink>
                  )}
                  {!notice.readAt && (
                    <form action={readNotification}>
                      <SubmitButton variant="quiet" size="sm" busyLabel="Marking…">
                        Mark read
                      </SubmitButton>
                      <input type="hidden" name="id" value={notice.id} />
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
