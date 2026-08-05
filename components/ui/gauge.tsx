import { cn } from "@/lib/utils";

/**
 * A dial.
 *
 * Installed from Watermelon UI (`gauge`) and reworked onto this app's own
 * surface, the same way `split-flap-display` and `flip-clock` were. It belongs
 * here for a reason beyond looking the part: the brand is *hash* plus *metrik*,
 * the parent system takes everything structural from measuring instruments —
 * rules, ticks, readings, tabular figures — and a dial with a scale on it is
 * the most direct statement of that this product has anywhere. A bar says
 * "some of it is done". A dial says how much, against a scale you can see.
 *
 * What the original was and what it is now:
 *
 * - It was a full ring with the number in the hole. A ring has no beginning, so
 *   there is nothing to read it against; that is a donut chart, not an
 *   instrument. This is the half dial a gauge actually has — a scale that runs
 *   from a left end to a right end, with ticks on it, read the way you read
 *   anything with a needle.
 * - It carried `danger`/`warning`/`info`/`success` presets in tailwind palette
 *   colours, gradients, a glow filter, multi-ring mode and threshold pips: nine
 *   ways to colour one number, none of them this board's. There are two tones
 *   here — the lit flap, and the coral that means somebody is waiting — because
 *   there are two things a proportion on this product can mean.
 * - It animated through `motion`'s `useMotionValue`/`useSpring`, and counted the
 *   readout up in React state, which is a render per frame and a component that
 *   is blank until it hydrates. Both are now CSS: `--dial-sweep` and
 *   `--dial-count` are registered custom properties, the arc's `stroke-dasharray`
 *   and the readout's `counter()` are computed off them, and one keyframe
 *   animates both **from** zero. So this is a server component with no
 *   JavaScript at all, the settled state is what the server sent, and a page
 *   that never hydrates is still a finished page — which is the same trick, and
 *   the same reasoning, as the site's opening counter in `globals.css`.
 * - `pathLength="100"` is what lets the sweep be written as a percentage
 *   directly, instead of the four functions of circumference, gap and offset
 *   the original needed to arrive at the same dash array.
 *
 * The scale is the part worth keeping from the original: `tickMarks` was an
 * option there and is the point here. Nine marks, long at the quarters, drawn
 * outside the track in the seam colour — a printed scale on the instrument's
 * face, which is what makes the arc a reading rather than a shape.
 */

const SIZES = {
  sm: { box: "w-[6.5rem]", reading: "text-[1.375rem]", stroke: 7 },
  md: { box: "w-[8.5rem]", reading: "text-[1.75rem]", stroke: 7.5 },
} as const;

/* The dial's face, in the viewBox's own units. The arc is centred at (50,50)
   with the drawing cropped just below it, so the box is a half-circle and not a
   circle with an empty lower half padding every layout it lands in. */
const CX = 50;
const CY = 50;
const R = 40;
const TICK_OUT = 47.5;

/** Where a tick at `t` (0–1 along the scale) starts and ends. */
function tick(t: number, length: number) {
  const angle = Math.PI * (1 - t);
  const inner = TICK_OUT - length;
  return {
    x1: CX + inner * Math.cos(angle),
    y1: CY - inner * Math.sin(angle),
    x2: CX + TICK_OUT * Math.cos(angle),
    y2: CY - TICK_OUT * Math.sin(angle),
  };
}

const TICKS = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  /* Long marks at the quarters, the way a real scale marks its units — the same
     rule the site's tick rule follows. */
  return { t, major: i % 2 === 0, ...tick(t, i % 2 === 0 ? 5.5 : 3) };
});

export function Dial({
  label,
  value,
  max = 100,
  caption,
  tone = "lit",
  size = "md",
  className,
}: {
  /** What is being measured. Printed under the scale. */
  label: string;
  value: number;
  max?: number;
  /** The count behind the percentage — "4 of 7 milestones". */
  caption?: string;
  /** `waiting` lights the coral: a proportion that is somebody's to move. */
  tone?: "lit" | "waiting";
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const rounded = Math.round(pct);
  const { box, reading, stroke } = SIZES[size];

  return (
    <div className={cn("min-w-0", className)}>
      <div
        /* `--dial-sweep` and `--dial-count` are the reading. Everything below
           computes off them, and the keyframe animates both from zero once. */
        className={cn("dial relative", box)}
        style={
          {
            "--dial-sweep": pct,
            "--dial-count": rounded,
          } as React.CSSProperties
        }
      >
        <svg
          viewBox="0 0 100 56"
          role="meter"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${caption ?? `${rounded}%`}`}
          className="w-full overflow-visible"
        >
          {/* The scale. Drawn first so the track and the arc sit over its
              inner ends rather than under them. */}
          {TICKS.map((t) => (
            <line
              key={t.t}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              className="stroke-slate"
              strokeWidth={t.major ? 1.6 : 1.1}
              strokeLinecap="butt"
              vectorEffect="non-scaling-stroke"
              opacity={t.major ? 0.85 : 0.5}
            />
          ))}

          {/* The track the reading runs in, the same one `Meter` uses, bent
              round. */}
          <path
            d={`M${CX - R},${CY} A${R},${R} 0 0 1 ${CX + R},${CY}`}
            fill="none"
            className="stroke-ash"
            strokeWidth={stroke}
            strokeLinecap="round"
          />

          {/* And the reading itself. `pathLength` makes the dash array a
              percentage, so the sweep is the number and nothing has to know the
              radius. */}
          <path
            d={`M${CX - R},${CY} A${R},${R} 0 0 1 ${CX + R},${CY}`}
            pathLength={100}
            fill="none"
            className={cn("dial-arc", tone === "waiting" ? "stroke-coral" : "stroke-ink")}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        </svg>

        {/* The reading, printed by CSS — see `--dial-count`. `aria-hidden`
            because the `role="meter"` above already announces the value, and a
            screen reader that met both would read the number twice. */}
        <p
          aria-hidden
          className={cn(
            "dial-count absolute inset-x-0 bottom-0 text-center font-display font-semibold text-ink tabular-nums",
            reading,
          )}
        />
      </div>

      <p className="mt-3 truncate text-sm font-medium text-slate">{label}</p>
      {caption && <p className="mt-1 truncate text-sm text-ink">{caption}</p>}
    </div>
  );
}
