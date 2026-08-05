"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { iconFor } from "@/components/app/icon";

/**
 * The sections down the sidebar.
 *
 * The active row is one moving highlight rather than a background that
 * appears somewhere else — a `motion` shared-layout element, so moving
 * between sections reads as one continuous slide instead of two rows
 * blinking in turn.
 *
 * Client component for a reason that has nothing to do with the animation.
 * The nav lives in a layout, and **layouts do not re-render on navigation** —
 * Next says so in as many words, and adds that this is exactly why they must
 * not read the pathname, "which would otherwise become stale". A
 * server-rendered sidebar was marked once, on whichever page you first landed
 * on, and never again: clicking Notices loaded Notices and left the mark
 * behind on Overview. `usePathname` in a client component is always current,
 * and is the fix the framework documents.
 */
export type NavLink = { href: string; label: string; badge?: number };

export function NavLinks({ area, links }: { area: string; links: NavLink[] }) {
  const pathname = usePathname();
  const still = useReducedMotion();

  /**
   * The link that is current, rather than every link that is a prefix of it.
   *
   * `/dashboard` is a prefix of `/dashboard/notifications`, so a plain
   * `startsWith` test lit Overview up on every page in the area — two rows lit
   * at once, and the sidebar no longer said where you were. The longest match
   * is the specific one, and it is the only one marked.
   */
  const activeHref = links
    .filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .reduce<string | null>(
      (best, link) => (best && best.length >= link.href.length ? best : link.href),
      null,
    );

  return (
    /* Scrolls inside the sidebar rather than pushing the account block off
       the bottom of it: the admin area has ten sections, and on a laptop in
       landscape that column is shorter than the list. */
    <nav
      aria-label={`${area} sections`}
      className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-4"
    >
      <ul className="flex flex-col gap-0.5">
        {links.map((link) => {
          const active = link.href === activeHref;
          const Icon = iconFor(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-coral/50 ${
                  active ? "text-ink" : "text-slate hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    aria-hidden
                    layoutId="sidebar-active"
                    transition={
                      still
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38, mass: 0.7 }
                    }
                    className="absolute inset-0 rounded-lg bg-coral/10"
                  />
                )}

                {!active && (
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-lg bg-ink/0 transition-colors duration-200 group-hover:bg-ink/[0.04]"
                  />
                )}

                <span
                  aria-hidden
                  className={`relative flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ${
                    active ? "text-coral" : "text-slate group-hover:text-ink"
                  }`}
                >
                  <Icon className="size-[1.125rem]" />
                </span>

                <span className="relative min-w-0 flex-1 truncate font-medium">{link.label}</span>

                {link.badge ? (
                  <span className="relative inline-flex min-w-5 items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-white">
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
