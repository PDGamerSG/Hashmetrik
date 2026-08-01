import { MarkField } from "@/components/site/mark-field";
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { AUDIENCES, PILLARS, SERVICES } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The strip of readings under the hero.
 *
 * A site built on measuring instruments printed no measurements of its own:
 * the hero made a claim, the metrics tape named the vocabulary, and then the
 * argument began without a single figure in it. This is the readout that tape
 * is a scale for — four numbers, counted up as they land, immediately below
 * the fold.
 *
 * Every figure here is the site's own content counted, not a statistic. The
 * pillars, the services and the sectors are the lengths of the lists further
 * down the page, so the strip cannot drift out of step with what it summarises;
 * the forty-eight hours is the promise already made in the contact band. A
 * credibility band that has to be maintained by hand is one that eventually
 * lies.
 *
 * It is a strip rather than a section on purpose, and it carries no reading on
 * the tick rule: it is not a step in the argument, it is the hero's own footer.
 * Section 01 still opens the case.
 */
const READINGS = [
  {
    value: PILLARS.length,
    suffix: "",
    label: "Pillars in every package",
    note: "Bought as one",
  },
  {
    value: SERVICES.length,
    suffix: "",
    label: "Channels, run as one system",
    note: "Not six retainers",
  },
  {
    value: AUDIENCES.length,
    suffix: "",
    label: "Sectors with their own playbook",
    note: "The model sets the plan",
  },
  {
    value: 48,
    suffix: "h",
    label: "To a written growth thesis",
    note: "Hire us or not",
  },
] as const;

export function Readout() {
  return (
    <div className="relative overflow-hidden bg-bone text-ink">
      <MarkField className="pointer-events-none absolute inset-0 text-ink" />

      <div className="shell relative py-12 md:py-16">
        <Reveal y={16} className="flex items-center gap-3 label text-slate">
          <span aria-hidden className="h-px w-6 bg-coral" />
          <span>Readout</span>
          <span aria-hidden className="hidden h-px flex-1 bg-ash sm:block" />
          <span className="hidden text-slate/70 sm:block">What one package covers</span>
        </Reveal>

        {/* Hairlines between the cells rather than around them: this is a row
            off an instrument, and instruments rule their columns, they do not
            box them. Two-up on a phone, four-up from `md`, so the rule falls in
            a different place at each breakpoint — hence the two sets of
            classes rather than one. */}
        <Reveal
          as="ul"
          stagger={0.08}
          y={24}
          className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:mt-10 md:grid-cols-4 md:gap-x-8"
        >
          {READINGS.map((reading, i) => (
            <li
              key={reading.label}
              className={cn(
                "border-ash",
                i % 2 !== 0 && "border-l pl-5 sm:pl-8",
                "md:border-l md:pl-7 lg:pl-10",
                i === 0 && "md:border-l-0 md:pl-0",
              )}
            >
              <div className="flex items-start gap-0.5 font-display text-[clamp(2.5rem,7vw,4.25rem)] leading-[0.85] font-medium tracking-[-0.03em]">
                <Counter value={reading.value} pad={2} />
                {reading.suffix && (
                  <span className="mt-[0.12em] text-[0.36em] text-coral">{reading.suffix}</span>
                )}
              </div>

              <p className="mt-4 max-w-[15rem] text-sm leading-snug text-ink/85 md:text-[15px]">
                {reading.label}
              </p>
              <p className="mt-1.5 label-sm text-slate/70">{reading.note}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </div>
  );
}
