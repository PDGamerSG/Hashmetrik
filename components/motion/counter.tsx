"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { EASE_OUT_QUINT, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A number that rolls up to its value, one digit column at a time.
 *
 * The site is called Hashmetrik and until now it printed no readings of its
 * own, which is the one thing a measuring instrument has to do. This is the
 * component that lets it: an odometer, where each digit is a strip of 0–9
 * clipped to a single line box and translated to bring the right numeral into
 * view. Because the strip is continuous, a count from 0 to 48 spins the units
 * column ten times while the tens column turns four — the numerals behave like
 * a mechanism rather than like text being replaced.
 *
 * Three properties matter here and all three come from driving it with one
 * motion value:
 *
 * - **No render per frame.** The value is written to the compositor through
 *   `useTransform`; React renders the digits once and never again.
 * - **Readable without JavaScript.** The finished number is what the server
 *   sends, sitting at its resting position. If the bundle never arrives the
 *   reading is simply correct and still.
 * - **One curve.** Same deceleration as every other entrance on the site, so
 *   the count settles when the block around it settles.
 */

const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * How far this numeral is from the one currently showing, as a fraction of the
 * line box. The wrap at five is what keeps the roll short: a column moving from
 * 9 to 0 travels one step forward rather than nine steps back.
 */
function Numeral({ column, n }: { column: MotionValue<number>; n: number }) {
  const y = useTransform(column, (latest) => {
    const current = ((latest % 10) + 10) % 10;
    let offset = (10 + n - current) % 10;
    if (offset > 5) offset -= 10;
    return `${offset * 100}%`;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {n}
    </motion.span>
  );
}

/**
 * One digit column. `place` is 1 for units, 10 for tens, and so on.
 *
 * The obvious formula for a column's position — `value / place` — is wrong,
 * and wrong in a way that only shows at rest: counting to 8 leaves the tens
 * column at 0.8, four fifths of the way from the 0 to the 1, so a strip that
 * animated perfectly settles showing two half numerals. A real odometer does
 * not do this because its wheels carry rather than slide.
 *
 * So the column reads the *whole* number of times this place has turned over,
 * which is a step function and exact at rest, and a spring is laid over that
 * to put the roll back. The spring is what the eye reads as a mechanism; the
 * flooring is what makes the readout true.
 */
function Digit({ place, value }: { place: number; value: MotionValue<number> }) {
  const stepped = useTransform(value, (v) => Math.floor(v / place));
  /* Stiff, because it is chasing a step function that can move ten places in a
     second — a slack spring here lands late and the columns stop agreeing with
     each other on the way. */
  const column = useSpring(stepped, { stiffness: 260, damping: 34, restDelta: 0.002 });

  return (
    <span
      /* Sized in `em` so the counter inherits whatever type size it is set at.
         The box is a shade taller than the em to leave the lining figures of
         the display serif room inside their own clip. */
      className="relative block h-[1.1em] w-[0.62em] overflow-hidden"
      style={{ fontVariantNumeric: "tabular-nums lining-nums" }}
    >
      {STRIP.map((n) => (
        <Numeral key={n} column={column} n={n} />
      ))}
    </span>
  );
}

export function Counter({
  value,
  /** Minimum digits, zero-filled. `04` reads as a reading; `4` reads as a word. */
  pad = 0,
  duration = 1.6,
  className,
}: {
  value: number;
  pad?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = usePrefersReducedMotion();

  const count = useMotionValue(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(count, value, { duration, ease: EASE_OUT_QUINT });
    return () => controls.stop();
  }, [inView, reduced, count, value, duration]);

  const digits = Math.max(String(Math.trunc(value)).length, pad);
  /* Most significant column first: 10^(n-1) down to 10^0. */
  const places = Array.from({ length: digits }, (_, i) => 10 ** (digits - 1 - i));

  return (
    <span ref={ref} className={cn("inline-flex leading-none", className)}>
      {/* A screen reader is read the figure once, as a figure. The columns are
          a mechanism for showing it, not eleven separate numbers to announce. */}
      <span className="sr-only">{String(value).padStart(pad, "0")}</span>
      <span aria-hidden className="inline-flex">
        {places.map((place) => (
          <Digit key={place} place={place} value={count} />
        ))}
      </span>
    </span>
  );
}
