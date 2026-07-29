import { METRICS } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The metrics tape.
 *
 * A strip of the readings this agency is actually judged on, running edge to
 * edge between sections. It is the one loud element on the page, and it earns
 * the volume by being the brand's own vocabulary rather than ornament.
 *
 * The track is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless; `aria-hidden` on the duplicate keeps screen
 * readers from hearing the list twice.
 */
export function Tape({
  tone = "coral",
  reverse = false,
  className,
}: {
  tone?: "coral" | "gold" | "ink";
  reverse?: boolean;
  className?: string;
}) {
  const surface = {
    coral: "bg-coral text-bone",
    gold: "bg-gold text-ink",
    ink: "bg-ink text-bone",
  }[tone];

  const track = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {METRICS.map((metric) => (
        <li
          key={metric}
          className="flex shrink-0 items-center gap-10 font-mono text-xs uppercase tracking-[0.3em] tabular md:gap-14 md:text-sm"
        >
          {metric}
          <span aria-hidden className="text-base leading-none opacity-50">
            #
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("relative overflow-hidden py-3.5 md:py-4", surface, className)}>
      <div className={cn("flex w-max tape-track", reverse && "tape-track-reverse")}>
        {track(false)}
        {track(true)}
      </div>
    </div>
  );
}
