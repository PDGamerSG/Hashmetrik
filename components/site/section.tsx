import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { cn } from "@/lib/utils";
import { MarkField } from "./mark-field";

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
 * ticks give the page a single vertical unit that the mark field and the
 * spacing both inherit.
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
      <MarkField className={cn("pointer-events-none absolute inset-0", t.rule)} />

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
                  "block pl-4 label tabular [writing-mode:vertical-rl]",
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

  /* Every heading on the page is set line by line as it lands — the two that
     used `SplitHeading` directly (the package intro, the contact band) and now
     the four that go through this component too. Before, four of the six
     section heads simply appeared while every list, grid and paragraph beneath
     them animated, which read as the headings having been forgotten rather
     than as restraint. The eyebrow leads by a fraction and the standfirst
     follows, so the head arrives as one gesture in three beats. */
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Reveal
          y={12}
          duration={0.7}
          className={cn("flex items-center gap-3 label tabular", t.reading)}
        >
          <span className="lg:hidden">{reading}</span>
          <span aria-hidden className={cn("h-px w-6 bg-current opacity-40 lg:hidden")} />
          <span className="text-coral">{eyebrow}</span>
        </Reveal>

        <SplitHeading className="mt-5 font-display text-[clamp(2rem,5.5vw,3.75rem)] leading-[1] font-medium tracking-[-0.018em] text-balance">
          {title}
        </SplitHeading>

        {desc && (
          <Reveal
            as="p"
            y={16}
            delay={0.12}
            className={cn(
              "mt-5 max-w-xl text-base leading-relaxed md:text-lg",
              tone === "ink" ? "text-bone/70" : "text-slate",
            )}
          >
            {desc}
          </Reveal>
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
    <em className="font-editorial italic font-normal tracking-[-0.008em] text-coral">{children}</em>
  );
}
