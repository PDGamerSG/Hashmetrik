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
    <nav aria-label={`${area} sections`} className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4">
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
                   the width of the rail.

                   The rail is ink now, so the marked row is the inverse of what
                   it was: a piece of the paper you are working on, cut into the
                   frame. It is the same relationship the page has to the rail,
                   stated once more at the size of a link. */
                className={`label flex items-center rounded-sheet px-3 py-2.5 transition-colors duration-200 ${
                  active
                    ? "bg-bone text-ink"
                    : "text-haze-2 hover:bg-bone/[0.07] hover:text-bone"
                }`}
              >
                {link.label}
                {link.badge ? (
                  /* The unread count, drawn as a reading rather than as a red
                     dot: how many is the useful part. Coral on the paper row,
                     coral on the ink — this is the one count on the rail that
                     is asking for something, so it keeps the accent in both
                     states rather than going quiet on the row you are on. */
                  <span
                    className={`tabular ml-auto inline-flex min-w-4 items-center justify-center rounded-full px-1 py-px text-[10px] ${
                      active ? "bg-coral text-ink" : "bg-coral/85 text-ink"
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
