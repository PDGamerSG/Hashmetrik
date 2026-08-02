import Link from "next/link";

/**
 * The bar across the top of every signed-in page.
 *
 * Links are passed in rather than derived here, because which ones exist is a
 * question about the viewer's role and that answer belongs next to the session,
 * not in a component. `signOut` is passed for the same reason: the admin area
 * returns to its own login page, the rest to the public one.
 *
 * Sign-out is a form rather than a link because it changes state, and a link
 * that changes state is one prefetch away from signing people out by accident.
 */
export type NavLink = { href: string; label: string; badge?: number };

export function AppNav({
  area,
  email,
  links,
  current,
  signOut,
}: {
  area: string;
  email: string;
  links: NavLink[];
  current: string;
  signOut: () => Promise<void>;
}) {
  return (
    <header className="border-b border-ash">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 md:px-10">
        <Link href="/" className="font-display text-lg font-medium tracking-[-0.015em] text-ink">
          HashMetrik
        </Link>
        <span className="label-sm text-slate">{area}</span>

        <nav aria-label={`${area} sections`} className="flex flex-wrap items-center gap-1">
          {links.map((link) => {
            const active = current === link.href || current.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`label rounded-full border px-3 py-1.5 transition-colors ${
                  active
                    ? "border-ink bg-ink text-bone"
                    : "border-transparent text-slate hover:border-ash hover:text-ink"
                }`}
              >
                {link.label}
                {link.badge ? <span className="tabular ml-1.5">{link.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-slate sm:inline">{email}</span>
          <form action={signOut}>
            <button
              type="submit"
              className="h-9 rounded-sheet border border-ash px-3 text-[13px] text-ink transition-colors hover:border-ink hover:bg-bone-2"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
