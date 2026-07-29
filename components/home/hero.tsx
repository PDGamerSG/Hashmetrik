import Image from "next/image";
import { ActionLink } from "@/components/site/button";
import { Tape } from "@/components/site/tape";
import { HeroPanel } from "./hero-panel";

/* Three frames of the work itself, set at staggered heights so the row reads
   as a contact sheet rather than a tidy gallery. */
const FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    alt: "Strategists mapping a campaign across a wall of notes",
    caption: "Strategy",
    height: "h-44 sm:h-72 md:h-[26rem]",
  },
  {
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    alt: "A performance dashboard showing campaign metrics",
    caption: "Reporting",
    height: "h-32 sm:h-56 md:h-[19rem]",
  },
  {
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80",
    alt: "A client review session in progress",
    caption: "Review",
    height: "h-52 sm:h-80 md:h-[30rem]",
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bone">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />

      {/* Two columns only once there is genuinely room for both: below xl the
          headline needs the full measure, and the panel goes back under it. */}
      <div className="shell relative grid gap-10 pt-10 pb-10 md:pt-12 md:pb-12 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-12">
        <div>
          <p className="rise flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-slate">
            <span className="text-coral">Hyderabad</span>
            <span aria-hidden className="hidden h-px w-8 bg-ash sm:block" />
            <span>PR · Performance · SEO · Social</span>
          </p>

          {/* The thesis. Set as three lines because the argument has three
              beats, and the serif italic lands on the only word that is a
              claim about method.

              The size is capped against viewport *height* as well as width:
              sized on width alone, a 1366x768 laptop pushes the headline so
              far down that the booking CTA falls below the fold. */}
          <h1 className="rise mt-5 font-display text-[clamp(2.75rem,min(10.5vw,15vh),9rem)] leading-[0.88] font-semibold tracking-[-0.045em]">
            <span className="block">Growth,</span>
            <span className="block">
              <em className="font-editorial pr-[0.06em] font-normal tracking-[-0.02em] text-coral">
                engineered.
              </em>
            </span>
            <span className="block text-ink/35">Not guessed.</span>
          </h1>

          {/* Two-up only in the middle range. Once the panel takes the right
              column there is no longer the measure for a second column here. */}
          <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-[1.1fr_minmax(0,1fr)] md:items-end xl:grid-cols-1 xl:items-start">
            <p className="max-w-xl text-lg leading-relaxed text-slate md:text-xl">
              We are a PR and digital marketing agency for brands that would rather read the number
              than guess at it. Strategy first, campaigns second, and a report you can check line by
              line.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row md:justify-end xl:justify-start">
              <ActionLink href="/book" className="h-14 px-7">
                Book a free consultation
              </ActionLink>
              <ActionLink href="/#services" variant="outline" className="h-14 px-7" arrow={false}>
                See what we do
              </ActionLink>
            </div>
          </div>
        </div>

        <HeroPanel />
      </div>

      <Tape />

      <div className="shell relative pt-10 pb-12 md:pt-14 md:pb-16">
        <ul className="grid grid-cols-3 items-end gap-3 md:gap-6">
          {FRAMES.map((frame) => (
            <li key={frame.caption}>
              <div
                className={`relative w-full overflow-hidden rounded-sheet bg-ash ${frame.height}`}
              >
                <Image
                  src={frame.src}
                  alt={frame.alt}
                  fill
                  sizes="(max-width: 768px) 33vw, 28vw"
                  className="object-cover"
                />
              </div>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate md:text-[11px]">
                {frame.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
