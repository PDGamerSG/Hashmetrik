"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The strip of views a queue can be read in — a segmented control.
 *
 * Choosing "Contacted" is not an action, it is a lens, and it should not look
 * like the thing that saves a record. So the chosen one is a filled pill and
 * the rest sit flat in a shared track, rather than a row of loose chips.
 *
 * The filled pill travels between them with a shared-layout animation. These
 * are links, and which one is active is a fact about the URL, not about a
 * component's memory: the server decides, and the pill slides to wherever the
 * answer landed. `LayoutGroup` scopes the shared id to one strip, so a page
 * with two of these does not have a single pill trying to be in both.
 */

export function Filters({ label, children }: { label: string; children: ReactNode }) {
  const scope = useId();

  return (
    <nav
      aria-label={label}
      className={cn(
        "mt-6 inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-lg",
        "border border-ash bg-bone-2 p-1",
      )}
    >
      <LayoutGroup id={scope}>{children}</LayoutGroup>
    </nav>
  );
}

export function Filter({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  const still = useReducedMotion();

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium outline-none",
        "transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-coral/50",
        active ? "text-ink" : "text-slate hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          aria-hidden
          layoutId="filter-active"
          transition={
            still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38, mass: 0.7 }
          }
          className="absolute inset-0 rounded-md bg-bone shadow-sm"
        />
      )}

      <span className="relative">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="relative tabular-nums text-slate">{count}</span>
      )}
    </Link>
  );
}
