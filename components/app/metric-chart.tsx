"use client";

import { useId, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { MetricSeries } from "@/lib/kpis/series";
import { cn } from "@/lib/utils";

/**
 * A month-by-month reading of one metric.
 *
 * Inline SVG, no charting library: a handful of points on one line is a shape a
 * browser can draw from a path string, and the smallest chart library is larger
 * than this whole dashboard.
 *
 * The line is ink and the fill is a wash of it that fades into the paper — the
 * coral accent is spent on things that need a decision, and a chart is a
 * reading, not a request. One series, so there is no legend: the label above
 * the figure names it, and the figure is the last point on the line.
 *
 * It reads every month, not just the last one. A chart with no way to ask "what
 * was March" is a picture of data rather than the data, so pointing at the plot
 * runs a crosshair to the nearest month and prints it. That is the only reason
 * this is a client component; everything it needs arrives as props, so the
 * whole shape is still server-rendered on the first paint and the crosshair
 * simply starts working once the page is interactive.
 */
export function MetricChart({ series }: { series: MetricSeries }) {
  const points = series.points;
  const values = points.map((p) => p.value);
  const wash = useId().replace(/:/g, "");

  /* Which month the pointer is nearest, or none. A reader without a pointer is
     not left out: the plot's `aria-label` reads every month and its value, and
     the row of figures beside it is the same series in print. */
  const [at, setAt] = useState<number | null>(null);

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  /* A flat series would otherwise divide by zero and disappear. */
  const span = max - min || 1;

  const width = 100;
  const height = 32;

  const coords = points.map((point, i) => {
    const x = points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
    const y = height - ((point.value - min) / span) * height;
    return { x, y, ...point };
  });

  const line = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = coords.at(-1);

  const latest = points.at(-1);
  const previous = points.at(-2);
  const change =
    latest && previous && previous.value !== 0
      ? ((latest.value - previous.value) / Math.abs(previous.value)) * 100
      : null;

  /* Direction, not judgement: a fall in cost per lead is a good month, and this
     component has no way of knowing which metric it is holding. So the arrow
     turns and the figure stays ink. */
  const flat = change === null || Math.abs(change) < 0.05;
  const Trend = flat ? ArrowRight : change! > 0 ? ArrowUpRight : ArrowDownRight;

  const plotted = points.length > 1;
  const marked = at !== null ? coords[at] : null;
  /* What the big figure shows: the month under the pointer while there is one,
     the latest month otherwise. The reading and the crosshair never disagree. */
  const shown = marked ?? latest;

  return (
    <div>
      <p className="label-xs text-slate">{series.metricName}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="tabular font-display text-[1.75rem] leading-none font-medium tracking-[-0.02em] text-ink">
          {formatValue(shown?.value)}
        </p>
        {series.unit && <span className="text-xs text-slate">{series.unit}</span>}

        {change !== null && (
          <span className="tabular ml-auto inline-flex items-center gap-1 text-xs text-slate">
            <Trend aria-hidden className={cn("size-3", !flat && "text-ink")} />
            {change >= 0 ? "+" : ""}
            {change.toFixed(1)}%
          </span>
        )}
      </div>

      {plotted && (
        <div
          className="relative mt-4"
          onPointerLeave={() => setAt(null)}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            if (box.width === 0) return;
            const ratio = (event.clientX - box.left) / box.width;
            const nearest = Math.round(ratio * (points.length - 1));
            setAt(Math.max(0, Math.min(points.length - 1, nearest)));
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`${series.metricName} over ${points.length} months, ${points
              .map((p) => `${p.period}: ${p.value}`)
              .join(", ")}`}
            className="h-20 w-full overflow-visible"
          >
            <defs>
              {/* The wash under the line fades out downward instead of ending
                  in a flat band — a solid tint with a hard bottom edge reads as
                  a second shape sitting under the chart. */}
              <linearGradient id={`wash-${wash}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            <path d={area} fill={`url(#wash-${wash})`} />

            {marked && (
              <line
                x1={marked.x}
                x2={marked.x}
                y1="0"
                y2={height}
                className="stroke-ink/25"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}

            <path
              d={line}
              className="stroke-ink"
              fill="none"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* The last point carries a dot because the figure printed above is
                that point and nothing was saying so. The marked point takes the
                dot over while the pointer is on the plot. */}
            {(marked ?? last) && (
              <circle
                cx={(marked ?? last)!.x}
                cy={(marked ?? last)!.y}
                r="3"
                className="fill-bone-2 stroke-ink"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* The reading, printed where the pointer is. Ink on bone, following
              the same rule as the console: a value being inspected is the one
              thing on this card that is not on paper. */}
          {marked && (
            <div
              className={cn(
                "pointer-events-none absolute -top-2 z-10 -translate-y-full rounded-sheet bg-ink px-2.5 py-1.5 whitespace-nowrap shadow-lift",
                /* Kept inside the card at both ends: at the first and last
                   month a centred label would hang off the edge. */
                at === 0
                  ? "translate-x-0"
                  : at === points.length - 1
                    ? "-translate-x-full"
                    : "-translate-x-1/2",
              )}
              style={{ left: `${marked.x}%` }}
            >
              <p className="label-xs text-haze-2">{marked.period}</p>
              <p className="tabular mt-1 text-[13px] leading-none text-bone">
                {formatValue(marked.value)}
                {series.unit && <span className="text-haze-2"> {series.unit}</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* The scale under the line: where the series starts, and where it ends. */}
      <div className="tabular mt-2 flex items-baseline justify-between border-t border-ash pt-2 text-[10px] text-slate">
        <span>{points[0]?.period}</span>
        <span>{latest?.period}</span>
      </div>
    </div>
  );
}

function formatValue(value: number | undefined): string {
  if (value === undefined) return "—";
  /* Whole numbers stay whole: an impressions count written as 12,043.0 reads
     as a measurement error. */
  return Number.isInteger(value) ? value.toLocaleString("en-GB") : value.toFixed(2);
}
