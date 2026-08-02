import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { listNotifications } from "@/lib/notifications/store";
import { readAllNotifications, readNotification } from "../actions";
import { Card, Empty, PageHeader, SubmitButton, formatDateTime } from "@/components/app/ui";

export const metadata: Metadata = { title: "Notices" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const viewer = await verifySession();
  const notices = await listNotifications(viewer.id);
  const unread = notices.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Notices"
        meta={unread > 0 ? `${unread} unread` : "All caught up"}
        actions={
          unread > 0 ? (
            <form action={readAllNotifications}>
              <SubmitButton variant="quiet">Mark all read</SubmitButton>
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
            <Card
              as="li"
              key={notice.id}
              /* Unread is carried by a coral edge rather than a background wash:
                 the list stays one colour, and the eye still finds the new ones. */
              className={notice.readAt ? "opacity-70" : "border-l-2 border-l-coral"}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm leading-relaxed text-ink">{notice.message}</p>
                  <p className="mt-1 text-xs text-slate">{formatDateTime(notice.createdAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  {notice.href && (
                    <Link
                      href={notice.href}
                      className="label-sm rounded-full border border-ash px-3 py-1.5 text-slate transition-colors hover:border-ink hover:text-ink"
                    >
                      Open
                    </Link>
                  )}
                  {!notice.readAt && (
                    <form action={readNotification}>
                      <input type="hidden" name="id" value={notice.id} />
                      <SubmitButton variant="quiet">Mark read</SubmitButton>
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
