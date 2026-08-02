"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The section pills, and the one thing on this bar that has to know where you
 * are.
 *
 * This used to be part of the server-rendered nav, which read the path from an
 * `x-pathname` header the proxy set. It was wrong for a reason that has nothing
 * to do with the header: the nav lives in a layout, and **layouts do not
 * re-render on navigation** — Next says so in as many words, and adds that this
 * is exactly why they must not read the pathname, "which would otherwise become
 * stale". So the bar was marked once, on whichever page you first landed on,
 * and never again. Clicking Notices loaded Notices and left the highlight
 * behind on Overview.
 *
 * A client component re-renders on every navigation, so `usePathname` is always
 * current. It is the fix the framework documents, and it is why this is the one
 * island of client code in the shell.
 */
export type NavLink = { href: string; label: string; badge?: number };

export function NavLinks({ area, links }: { area: string; links: NavLink[] }) {
  const pathname = usePathname();

  /**
   * The link that is current, rather than every link that is a prefix of it.
   *
   * `/dashboard` is a prefix of `/dashboard/notifications`, so a plain
   * `startsWith` test lit Overview up on every page in the area — two pills
   * filled ink at once, and the bar no longer said where you were. The longest
   * match is the specific one, and it is the only one marked.
   */
  const activeHref = links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .reduce<string | null>(
      (best, link) => (best && best.length >= link.href.length ? best : link.href),
      null,
    );

  return (
    <nav
      aria-label={`${area} sections`}
      /* Its own full-width row below `md`, and a scrolling strip rather than a
         wrapping block. Sharing the top row with the wordmark and the sign-out
         button left it about 90px wide on a phone, which is one pill: every
         section but the first was off the side of the bar with nothing to say
         so. */
      className="order-last -mx-1 flex w-full min-w-0 items-center gap-1 overflow-x-auto px-1 pb-1 md:order-none md:w-auto md:flex-1 md:pb-0"
    >
      {links.map((link) => {
        const active = link.href === activeHref;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`label inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 transition-colors ${
              active
                ? "border-ink bg-ink text-bone"
                : "border-transparent text-slate hover:border-ash hover:text-ink"
            }`}
          >
            {link.label}
            {link.badge ? (
              /* The unread count, drawn as a reading rather than as a red dot:
                 how many is the useful part, and on the active pill a coral
                 disc on ink is the one place the accent still reads. */
              <span
                className={`tabular ml-2 inline-flex min-w-4 items-center justify-center rounded-full px-1 py-px text-[10px] ${
                  active ? "bg-coral text-ink" : "bg-ink text-bone"
                }`}
              >
                {link.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
