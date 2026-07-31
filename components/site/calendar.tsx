"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Monday-first offset, because the working week is what is being booked. */
function leadingBlanks(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * A month grid built in-house rather than pulled in, so the cells inherit the
 * site's own tick-and-reading treatment instead of arriving with a library's.
 * Sundays are closed and past dates are unbookable.
 */
export function Calendar({
  selected,
  onSelect,
}: {
  selected?: Date;
  onSelect: (date: Date) => void;
}) {
  const today = startOfDay(new Date());
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const blanks = leadingBlanks(year, month);

  /* Never let the visitor page back into months that hold no bookable day. */
  const atFirstMonth = year === today.getFullYear() && month === today.getMonth();

  /* Every month is drawn on six rows, whether or not it needs them, so the
     grid — and the Continue button under it — hold still while paging. */
  const trailing = 42 - blanks - daysInMonth;

  const shift = (delta: number) => setCursor(new Date(year, month + delta, 1));

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-medium tracking-[-0.012em]">
          {MONTHS[month]} <span className="tabular text-slate">{year}</span>
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={atFirstMonth}
            className="grid size-9 place-items-center rounded-sheet border border-ash transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="grid size-9 place-items-center rounded-sheet border border-ash transition-colors hover:border-ink"
          >
            <span className="sr-only">Next month</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div
            key={i}
            aria-hidden
            className="pb-1 text-center label-sm text-slate"
          >
            {day}
          </div>
        ))}

        {Array.from({ length: blanks }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const date = new Date(year, month, i + 1);
          const closed = date.getDay() === 0;
          const past = date < today;
          const disabled = closed || past;
          const isSelected = selected ? sameDay(date, selected) : false;

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              aria-label={formatDate(date)}
              className={cn(
                /* The cell height is read off the viewport rather than the
                   cell width: a 31-day month that opens on a Saturday needs
                   six rows, and six rows of squares put Continue below the
                   fold on a laptop. Floored at 36px so it stays tappable. */
                "h-[clamp(2rem,4.4vh,2.75rem)] rounded-sheet border font-mono text-sm tabular transition-colors",
                isSelected
                  ? "border-coral bg-coral text-bone"
                  : disabled
                    ? "border-transparent text-slate/35"
                    : "border-ash text-ink hover:border-ink hover:bg-bone-2",
              )}
            >
              {i + 1}
            </button>
          );
        })}

        {Array.from({ length: trailing }, (_, i) => (
          <div key={`trail-${i}`} aria-hidden className="h-[clamp(2rem,4.4vh,2.75rem)]" />
        ))}
      </div>
    </div>
  );
}
