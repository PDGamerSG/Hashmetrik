import { headers } from "next/headers";
import { AppNav, type NavLink } from "@/components/app/nav";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "./actions";

/**
 * The admin shell.
 *
 * It wraps the login page too, which has no session — so the check is done by
 * the pages underneath rather than here, and this only draws the bar when there
 * is somebody to draw it for.
 */
const LINKS: NavLink[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/consultations", label: "Calls" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/team", label: "Staff" },
  { href: "/admin/cms", label: "Content" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminChromeLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  /* The login page is inside this segment and must render for a signed-out
     visitor, so this asks rather than requires. Every other page under it calls
     `requireAdmin()` itself. */
  if (pathname === "/admin/login") return <>{children}</>;

  const admin = await requireAdmin();

  return (
    <>
      <AppNav
        area="Admin"
        email={admin.email}
        links={LINKS}
        current={pathname}
        signOut={logout}
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:px-10">{children}</div>
    </>
  );
}
