import { Tape } from "@/components/site/tape";
import { ImageZoom } from "@/components/motion/image-zoom";
import { Parallax } from "@/components/motion/reveal";
import { HeroField } from "./hero-field";
import { HeroLead } from "./hero-lead";
import { HeroPanel } from "./hero-panel";

/* Three frames of the work itself, set at staggered heights so the row reads
   as a contact sheet rather than a tidy gallery. The parallax speeds are
   staggered with them: the tall frame is nearest and moves most.

   Each carries a clip as well as a still. A contact sheet is the one place on
   the page where motion is the subject rather than an effect — these are three
   moments from a working day, and a moment is a thing that moves. */
const FRAMES = [
  {
    src: "/frames/strategy.webp",
    video: "/frames/strategy.mp4",
    alt: "A strategist pinning a campaign map to a wall of working notes",
    caption: "Strategy",
    height: "h-44 sm:h-72 md:h-[26rem]",
    speed: 0.1,
  },
  {
    src: "/frames/reporting.webp",
    video: "/frames/reporting.mp4",
    alt: "A performance dashboard being read beside its printed weekly report",
    caption: "Reporting",
    height: "h-32 sm:h-56 md:h-[19rem]",
    speed: 0.04,
  },
  {
    src: "/frames/review.webp",
    video: "/frames/review.mp4",
    alt: "A client review in progress across a table of printed pages",
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
                video={frame.video}
                alt={frame.alt}
                caption={`${frame.caption} — ${frame.alt}`}
                sizes="(max-width: 768px) 33vw, 28vw"
                /* The plates are portrait now, so the lightbox is too —
                   height-bound rather than width-bound, or a 3:4 frame opens
                   into a 4:3 box and loses a third of itself. */
                zoomClassName="aspect-3/4 h-[82dvh] w-auto max-w-full"
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
