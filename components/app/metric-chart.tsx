import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { MetricSeries } from "@/lib/kpis/series";
import { cn } from "@/lib/utils";

/**
 * A month-by-month reading of one metric.
 *
 * Inline SVG, no charting library: six points on one line is a shape a browser
 * can draw from a path string, and the smallest chart library is larger than
 * this whole dashboard. It also renders on the server, so a report opens with
 * the chart already in it rather than after a hydration.
 *
 * The line is ink and the fill is a faint wash of it — the coral accent is
 * spent on things that need a decision, and a chart is a reading, not a
 * request. The latest point carries a dot, because the number printed above
 * the chart is that point and nothing was saying so.
 */
export function MetricChart({ series }: { series: MetricSeries }) {
  const points = series.points;
  const values = points.map((p) => p.value);

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

  return (
    <div>
      <p className="label-xs text-slate">{series.metricName}</p>

      <div className="mt-3 flex items-baseline gap-2">
        <p className="tabular font-display text-2xl leading-none font-medium tracking-[-0.02em] text-ink">
          {formatValue(latest?.value)}
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

      {points.length > 1 && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${series.metricName} over ${points.length} months, ${points
            .map((p) => `${p.period}: ${p.value}`)
            .join(", ")}`}
          className="mt-4 h-14 w-full overflow-visible"
        >
          <path d={area} className="fill-ink/[0.07]" />
          <path
            d={line}
            className="stroke-ink"
            fill="none"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {last && (
            <circle
              cx={last.x}
              cy={last.y}
              r="2"
              className="fill-bone-2 stroke-ink"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
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
