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
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/team", label: "Staff" },
  { href: "/admin/cms", label: "Content" },
  { href: "/admin/assistant", label: "Assistant" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminChromeLayout({ children }: { children: React.ReactNode }) {
  /* Set by `proxy.ts`. Still read here, and only here: a layout renders once and
     is not re-run on navigation, so a pathname taken from the request is only
     trustworthy for a decision that is settled on a full render. This is one —
     `/admin/login` is reached by a redirect or a typed URL, never by a link from
     inside the admin area. Marking the current *nav* link is the opposite case,
     which is why that moved into a client component. */
  const pathname = (await headers()).get("x-pathname") ?? "";

  /* The login page is inside this segment and must render for a signed-out
     visitor, so this asks rather than requires. Every other page under it calls
     `requireAdmin()` itself. */
  if (pathname === "/admin/login") return <>{children}</>;

  const admin = await requireAdmin();

  return (
    <>
      <AppNav area="Admin" email={admin.email} links={LINKS} signOut={logout} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:px-10">{children}</div>
    </>
  );
}
