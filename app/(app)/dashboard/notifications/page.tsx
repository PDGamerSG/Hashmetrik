import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";
import { listNotifications } from "@/lib/notifications/store";
import { readAllNotifications, readNotification } from "../actions";
import {
  ButtonLink,
  Empty,
  PageHeader,
  SubmitButton,
  formatDateTime,
} from "@/components/app/ui";
import { cn } from "@/lib/utils";

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
        meta={
          notices.length === 0
            ? "Approvals, scheduled calls and project updates land here."
            : unread > 0
              ? `${unread} unread of ${notices.length}`
              : `All ${notices.length} read`
        }
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
        <Empty>Nothing yet. Approvals, scheduled calls and project updates all land here.</Empty>
      ) : (
        /* A ledger rather than a stack of cards: a notice is one line, and
           twelve of them in boxes is a page you scroll instead of read. */
        <ul className="mt-8 divide-y divide-ash border-y border-ash">
          {notices.map((notice) => (
            <li
              key={notice.id}
              className={cn(
                "flex flex-wrap items-start gap-x-4 gap-y-3 py-4 transition-colors",
                notice.readAt && "text-slate",
              )}
            >
              {/* Unread is one coral tick at the head of the row — the same mark
                  the tick rule is made of. It replaces the coloured slab down
                  the card's left edge, which at 2px was the loudest thing in a
                  list where most rows are already read. */}
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-3 w-px shrink-0",
                  notice.readAt ? "bg-ash" : "bg-coral",
                )}
              />

              <div className="min-w-0 flex-1 basis-64">
                <p
                  className={cn(
                    "text-sm leading-relaxed",
                    notice.readAt ? "text-slate" : "text-ink",
                  )}
                >
                  {notice.message}
                  {!notice.readAt && <span className="sr-only"> (unread)</span>}
                </p>
                <p className="tabular label-xs mt-1.5 text-slate">
                  {formatDateTime(notice.createdAt)}
                </p>
              </div>

              <div className="ml-auto flex shrink-0 items-center gap-2">
                {notice.href && (
                  <ButtonLink href={notice.href} variant="quiet" size="sm">
                    Open
                  </ButtonLink>
                )}
                {!notice.readAt && (
                  <form action={readNotification}>
                    <input type="hidden" name="id" value={notice.id} />
                    <SubmitButton variant="quiet" size="sm" busyLabel="Marking…">
                      Mark read
                    </SubmitButton>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
