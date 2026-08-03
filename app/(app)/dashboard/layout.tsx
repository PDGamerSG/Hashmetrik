import { AppShell, type NavLink } from "@/components/app/shell";
import { logout } from "@/app/(app)/actions";
import { verifySession } from "@/lib/auth/dal";
import { countUnread } from "@/lib/notifications/store";
import { prisma } from "@/lib/db";

/**
 * The signed-in shell.
 *
 * Which links exist is a question about the viewer, so it is answered here
 * where the session is, rather than inside the nav component. A registered user
 * who is not yet a client sees three; the client area appears the moment an
 * admin activates them, because this reads the client row rather than the
 * status in the token.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const viewer = await verifySession();

  const [unread, client] = await Promise.all([
    countUnread(viewer.id).catch(() => 0),
    prisma.client.findUnique({ where: { userId: viewer.id }, select: { id: true } }).catch(() => null),
  ]);

  const links: NavLink[] = [
    { href: "/dashboard", label: "Overview" },
    ...(client
      ? [
          { href: "/dashboard/client", label: "Work" },
          { href: "/dashboard/client/calendar", label: "Calendar" },
          { href: "/dashboard/client/reports", label: "Reports" },
        ]
      : []),
    { href: "/dashboard/notifications", label: "Notices", badge: unread },
  ];

  return (
    <AppShell
      area={client ? "Client" : "Account"}
      email={viewer.email}
      links={links}
      signOut={logout}
    >
      {children}
    </AppShell>
  );
}
