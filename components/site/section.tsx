import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "bone" | "ink";

const TONE = {
  bone: {
    surface: "bg-bone text-ink",
    rule: "text-ink",
    hairline: "border-ash",
    reading: "text-slate",
  },
  ink: {
    surface: "bg-ink text-bone",
    rule: "text-bone",
    hairline: "border-ash-ink",
    reading: "text-bone/50",
  },
} as const;

type SectionProps = {
  id?: string;
  /** The section's position on the scale, e.g. "02". Shown on the rule. */
  reading: string;
  /** Short name for this reading, set vertically alongside it. */
  label: string;
  tone?: Tone;
  className?: string;
  children: ReactNode;
};

/**
 * A section registered against the tick rule.
 *
 * The rule is the site's signature: a measuring scale down the left gutter
 * where every section is a labelled reading. It is structural, not
 * decorative — the reading tells you where in the argument you are, and the
 * ticks give the page a single vertical unit that the grain and spacing
 * both inherit.
 */
export function Section({
  id,
  reading,
  label,
  tone = "bone",
  className,
  children,
}: SectionProps) {
  const t = TONE[tone];

  return (
    <section id={id} className={cn("relative overflow-hidden", t.surface, className)}>
      <div aria-hidden className={cn("pointer-events-none absolute inset-0 grain", t.rule)} />

      <div className="shell relative">
        <div className="grid lg:grid-cols-[3.5rem_minmax(0,1fr)]">
          {/* The rule lane. Hidden below lg, where there is no room for a
              gutter and the reading moves inline with the section head. */}
          <div aria-hidden className="relative hidden lg:block">
            <div className={cn("absolute left-0 top-0 h-full w-px tick-rule", t.rule)} />
            <div className={cn("absolute left-0 top-0 h-full w-2 tick-rule-major", t.rule)} />
            <div className="sticky top-28 pt-16">
              <span
                className={cn(
                  "block pl-4 font-mono text-[11px] uppercase tracking-[0.28em] tabular [writing-mode:vertical-rl]",
                  t.reading,
                )}
              >
                {reading} — {label}
              </span>
            </div>
          </div>

          <div className={cn("lg:border-l lg:pl-10 xl:pl-16", t.hairline)}>{children}</div>
        </div>
      </div>
    </section>
  );
}

type SectionHeadProps = {
  /** Repeats the rule's reading for small screens, where the gutter is gone. */
  reading: string;
  eyebrow: string;
  title: ReactNode;
  desc?: string;
  tone?: Tone;
  /** Optional action rendered opposite the head on wide screens. */
  action?: ReactNode;
};

export function SectionHead({
  reading,
  eyebrow,
  title,
  desc,
  tone = "bone",
  action,
}: SectionHeadProps) {
  const t = TONE[tone];

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div
          className={cn(
            "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] tabular",
            t.reading,
          )}
        >
          <span className="lg:hidden">{reading}</span>
          <span aria-hidden className={cn("h-px w-6 bg-current opacity-40 lg:hidden")} />
          <span className="text-coral">{eyebrow}</span>
        </div>

        <h2 className="mt-5 font-display text-[clamp(2rem,5.5vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </h2>

        {desc && (
          <p
            className={cn(
              "mt-5 max-w-xl text-base leading-relaxed md:text-lg",
              tone === "ink" ? "text-bone/70" : "text-slate",
            )}
          >
            {desc}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * A word set in the editorial serif italic. Used on one or two words per
 * heading at most — the contrast is the point, and it stops working the
 * moment it is applied to a whole line.
 */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <em className="font-editorial italic font-normal tracking-[-0.01em] text-coral">{children}</em>
  );
}
