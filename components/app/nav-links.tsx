"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The sections down the rail, and the one thing on it that has to know where
 * you are.
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
 * current. It is the fix the framework documents.
 */
export type NavLink = { href: string; label: string; badge?: number };

export function NavLinks({ area, links }: { area: string; links: NavLink[] }) {
  const pathname = usePathname();

  /**
   * The link that is current, rather than every link that is a prefix of it.
   *
   * `/dashboard` is a prefix of `/dashboard/notifications`, so a plain
   * `startsWith` test lit Overview up on every page in the area — two rows
   * filled ink at once, and the rail no longer said where you were. The longest
   * match is the specific one, and it is the only one marked.
   */
  const activeHref = links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .reduce<string | null>(
      (best, link) => (best && best.length >= link.href.length ? best : link.href),
      null,
    );

  return (
    /* Scrolls inside the rail rather than pushing the account block off the
       bottom of it: the admin area has ten sections, and on a laptop in
       landscape that column is shorter than the list. */
    <nav aria-label={`${area} sections`} className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <ul className="flex flex-col gap-0.5">
        {links.map((link) => {
          const active = link.href === activeHref;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                /* Sheet corners, not pills: the system's rule is that
                   everything you read has corners and everything you press does
                   not, and a full-width row with round ends reads as a button
                   the width of the rail. */
                className={`label flex items-center rounded-sheet px-3 py-2.5 transition-colors ${
                  active ? "bg-ink text-bone" : "text-slate hover:bg-ink/[0.055] hover:text-ink"
                }`}
              >
                {link.label}
                {link.badge ? (
                  /* The unread count, drawn as a reading rather than as a red
                     dot: how many is the useful part, and on the active row a
                     coral disc on ink is the one place the accent still
                     reads. */
                  <span
                    className={`tabular ml-auto inline-flex min-w-4 items-center justify-center rounded-full px-1 py-px text-[10px] ${
                      active ? "bg-coral text-ink" : "bg-ink text-bone"
                    }`}
                  >
                    {link.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
