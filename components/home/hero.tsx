import { Tape } from "@/components/site/tape";
import { ImageZoom } from "@/components/motion/image-zoom";
import { Parallax } from "@/components/motion/reveal";
import { HeroField } from "./hero-field";
import { HeroLead } from "./hero-lead";
import { HeroPanel } from "./hero-panel";

/* Three frames of the work itself, set at staggered heights so the row reads
   as a contact sheet rather than a tidy gallery. The parallax speeds are
   staggered with them: the tall frame is nearest and moves most. */
const FRAMES = [
  {
    src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    alt: "Strategists mapping a campaign across a wall of notes",
    caption: "Strategy",
    height: "h-44 sm:h-72 md:h-[26rem]",
    speed: 0.1,
  },
  {
    src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    alt: "A performance dashboard showing campaign metrics",
    caption: "Reporting",
    height: "h-32 sm:h-56 md:h-[19rem]",
    speed: 0.04,
  },
  {
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80",
    alt: "A client review session in progress",
    caption: "Review",
    height: "h-52 sm:h-80 md:h-[30rem]",
    speed: 0.16,
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-bone">
      {/* Two backgrounds, one idea. The canvas is the loose marks; the grain
          is the ruled paper they came off. */}
      <HeroField className="pointer-events-none absolute inset-0 h-full w-full" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />

      {/* Two columns only once there is genuinely room for both: below xl the
          headline needs the full measure, and the panel goes back under it. */}
      <div className="shell relative grid gap-10 pt-10 pb-10 md:pt-12 md:pb-12 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-12">
        <HeroLead />
        <HeroPanel />
      </div>

      <Tape />

      <div className="shell relative pt-10 pb-12 md:pt-14 md:pb-16">
        <ul className="grid grid-cols-3 items-end gap-3 md:gap-6">
          {FRAMES.map((frame) => (
            <Parallax as="li" key={frame.caption} speed={frame.speed}>
              <ImageZoom
                src={frame.src}
                alt={frame.alt}
                caption={`${frame.caption} — ${frame.alt}`}
                sizes="(max-width: 768px) 33vw, 28vw"
                className={`w-full ${frame.height}`}
              />
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate md:text-[11px]">
                {frame.caption}
              </p>
            </Parallax>
          ))}
        </ul>
      </div>
    </section>
  );
}
