import { AppShell, type NavLink } from "@/components/app/shell";
import { logout } from "@/app/(app)/actions";
import { requireStaff } from "@/lib/auth/dal";
import { countUnread } from "@/lib/notifications/store";

/**
 * The staff shell.
 *
 * `requireStaff()` runs here and again in every page underneath. That is not
 * redundancy for its own sake: Next.js does not guarantee a layout runs before
 * the page it wraps on every navigation, so a layout is the wrong and only
 * place to put a check that has to hold.
 */
export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireStaff();
  const unread = await countUnread(viewer.id).catch(() => 0);

  const links: NavLink[] = [
    { href: "/team", label: "Queue" },
    { href: "/team/projects", label: "Projects" },
    { href: "/team/calendar", label: "Calendar" },
    { href: "/team/reports", label: "Reports" },
    { href: "/dashboard/notifications", label: "Notices", badge: unread },
  ];

  return (
    <AppShell area="Team" email={viewer.email} links={links} signOut={logout}>
      {children}
    </AppShell>
  );
}
