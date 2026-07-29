"use client";

import { useSyncExternalStore } from "react";
import { ArrowUpRight } from "lucide-react";
import { SectionLink } from "@/components/site/section-link";
import { SERVICES } from "@/lib/content";

/**
 * The hero's right column — an instrument panel.
 *
 * The headline is one enormous claim, so the space beside it wants the
 * opposite: fine-grained, factual, and readable at a glance. This is the
 * site's index of what it actually runs, led by the reading each service is
 * measured on, over a live clock in the studio's own timezone. Everything on
 * it is something the page already says elsewhere — nothing here is a number
 * invented to look impressive.
 */

/* Asia/Kolkata rather than the visitor's clock: the point of the reading is
   that it is the time where the people answering the phone are sitting. */
function studioTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

export function HeroPanel() {
  /**
   * The clock is state that lives outside React, so it is read rather than
   * copied into state. The server snapshot is null on purpose: this page is
   * prerendered, so any time baked into the HTML would be the time of the
   * build. The placeholder stands until hydration and the reading is right
   * from the first frame the visitor can see it change.
   *
   * Re-reading returns an equal string until the minute turns, which is what
   * keeps the interval from causing a render every fifteen seconds.
   */
  const time = useSyncExternalStore<string | null>(subscribe, studioTime, () => null);

  return (
    /* Wide screens only. It exists to fill the space beside the headline, and
       below xl there is no such space — the services section says all of this
       at full size a screen further down. Stretched to the height of the
       headline column so the right side reads as a panel, not a floating card. */
    <aside className="rise hidden flex-col overflow-hidden rounded-sheet border border-ash bg-bone-2 xl:flex">
      <div className="flex items-center justify-between gap-4 border-b border-ash px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
          <span aria-hidden className="pulse-dot size-1.5 rounded-full bg-coral" />
          Studio · Hyderabad
        </span>
        <span className="font-mono text-[10px] tracking-[0.24em] tabular text-slate">
          {/* The unit holds the row's width while the clock is still blank. */}
          {time ?? "—:—"} IST
        </span>
      </div>

      <div className="relative flex-1 py-1 pl-8">
        {/* The tick rule, as on every other measured surface on this site.
            Only the fine pitch here — at this width the long marks read as
            stray dashes rather than a scale. */}
        <div aria-hidden className="absolute inset-y-4 left-5 w-px tick-rule text-ink" />

        <ul className="flex h-full flex-col">
          {SERVICES.map((service, i) => (
            <li
              key={service.id}
              className="rise flex-1 border-b border-ash/70 last:border-b-0"
              style={{ animationDelay: `${140 + i * 45}ms` }}
            >
              <SectionLink
                href="/#services"
                className="group flex h-full items-center gap-3 py-2.5 pr-5"
              >
                <span className="w-14 shrink-0 font-mono text-[10px] tracking-[0.2em] tabular text-coral">
                  {service.code}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate transition-colors duration-300 group-hover:text-ink">
                  {service.name}
                </span>
                <ArrowUpRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-slate/50 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </SectionLink>
            </li>
          ))}
        </ul>
      </div>

      <p className="border-t border-ash px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
        Free consultation · 30 min
      </p>
    </aside>
  );
}
