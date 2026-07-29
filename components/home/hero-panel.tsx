"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { INTAKE, STUDIO_DAYS, TIME_SLOTS } from "@/lib/content";

/**
 * The hero's right column — the intake panel.
 *
 * The headline is one enormous claim, so the space beside it wants the
 * opposite: fine-grained, factual, and readable at a glance. What it shows is
 * the one thing the visitor can do from this screen — book the call — set out
 * as the three beats that follow it, on the same tick rule every other
 * measured surface on this site registers against.
 *
 * It carried the service list before. That was a second printing of the
 * services section a screen below, so the panel spent the most valuable
 * column on the page repeating an argument the page already wins later.
 *
 * Everything time-derived here is read live in the studio's own timezone:
 * whether anyone is in, and the next slot that is genuinely bookable.
 */

/* Asia/Kolkata rather than the visitor's clock: the point of the reading is
   that it is the time where the people answering the phone are sitting. */
const IST = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OPEN_DAYS = new Set<number>(STUDIO_DAYS);

/* The booking page's own slots, as minutes past midnight, so the panel can
   never offer a time the booking form does not actually have. */
const SLOTS = TIME_SLOTS.map((label) => {
  const [clock, meridiem] = label.split(" ");
  const [hour, minute] = clock.split(":").map(Number);
  return { label, at: ((hour % 12) + (meridiem === "PM" ? 12 : 0)) * 60 + minute };
});

const FIRST = SLOTS[0];
const LAST = SLOTS[SLOTS.length - 1];

/* Nobody books a call starting in ten minutes. An hour of lead time keeps the
   offered slot one a visitor could plausibly take. */
const LEAD = 60;

function nextSlot(day: number, now: number) {
  if (OPEN_DAYS.has(day)) {
    const slot = SLOTS.find((s) => s.at >= now + LEAD);
    if (slot) return `Today · ${slot.label}`;
  }

  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = (day + ahead) % 7;
    if (!OPEN_DAYS.has(next)) continue;
    return `${ahead === 1 ? "Tomorrow" : WEEKDAYS[next]} · ${FIRST.label}`;
  }

  return FIRST.label;
}

/**
 * One string rather than an object, because `useSyncExternalStore` compares
 * snapshots by identity — a fresh object every read would re-render forever.
 * Equal strings until the minute turns is what keeps the interval cheap.
 */
function snapshot() {
  const parts = IST.formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const day = WEEKDAYS.indexOf(read("weekday"));
  const hour = Number(read("hour"));
  const minute = Number(read("minute"));
  const now = hour * 60 + minute;

  /* Open until half an hour past the last slot — the length of the call. */
  const open = OPEN_DAYS.has(day) && now >= FIRST.at && now < LAST.at + 30;

  return `${read("hour")}:${read("minute")}|${open ? "1" : ""}|${nextSlot(day, now)}`;
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
   * build. Placeholders stand until hydration, and every reading is right from
   * the first frame the visitor can see it.
   */
  const state = useSyncExternalStore<string | null>(subscribe, snapshot, () => null);
  const [clock, open, slot] = state?.split("|") ?? [];

  return (
    /* Wide screens only. It exists to fill the space beside the headline, and
       below xl there is no such space — the booking page carries all of this
       at full size. Stretched to the height of the headline column so the
       right side reads as a panel, not a floating card. */
    <aside className="rise hidden flex-col overflow-hidden rounded-sheet border border-ash bg-bone-2 xl:flex">
      <div className="flex items-center justify-between gap-4 border-b border-ash px-5 py-3.5">
        <span className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${open ? "pulse-dot bg-coral" : "bg-slate/35"}`}
          />
          {/* Neutral until the clock is known, so the panel never claims the
              studio is shut in the frame before it has read the time. */}
          {state ? (open ? "Open" : "Closed") : "Studio"} · Hyderabad
        </span>
        <span className="font-mono text-[10px] tracking-[0.24em] tabular text-slate">
          {/* The unit holds the row's width while the clock is still blank. */}
          {clock ?? "—:—"} IST
        </span>
      </div>

      <div className="relative flex-1">
        {/* The tick rule, as on every other measured surface on this site.
            Only the fine pitch here — at this width the long marks read as
            stray dashes rather than a scale. The three beats hang off it as
            readings, which is the whole reason the scale is drawn. */}
        <div aria-hidden className="absolute inset-y-6 left-5 w-px tick-rule text-ink" />

        <ol className="flex h-full flex-col">
          {INTAKE.map((step, i) => (
            <li
              key={step.reading}
              className="rise relative flex-1 border-b border-ash/70 py-4 pr-5 pl-9 last:border-b-0"
              style={{ animationDelay: `${140 + i * 70}ms` }}
            >
              {/* Punched through the rule rather than drawn beside it. The
                  first beat is filled because it is the one on offer; the
                  rest are still open marks on the scale. */}
              <span
                aria-hidden
                /* The half pixel is the rule's own width: `left-5` puts the
                   hairline's left edge on 20, so its centre — and the mark
                   that has to sit on it — is half a pixel further right. */
                className={`absolute top-[1.4rem] left-[calc(1.25rem_+_0.5px)] size-[7px] -translate-x-1/2 rounded-full border border-coral ${
                  i === 0 ? "bg-coral" : "bg-bone-2"
                }`}
              />

              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[10px] tracking-[0.2em] tabular text-coral">
                  {step.reading}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{step.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] tabular text-slate">
                  {step.unit}
                </span>
              </div>

              <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{step.note}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* The whole footer is the target, not a link buried in it — it is the
          panel's one action and it should be the size of one. */}
      <Link
        href="/book"
        className="group flex items-center justify-between gap-4 border-t border-ash px-5 py-3.5 transition-colors duration-300 hover:bg-bone"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate">
          Next slot
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] tabular text-ink">
          {slot ?? "—"}
          <ArrowUpRight
            aria-hidden
            className="size-3.5 shrink-0 text-slate transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </Link>
    </aside>
  );
}
