"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { introDelay, useIsomorphicLayoutEffect } from "@/lib/motion";
import { PlateVideo } from "@/components/motion/plate-video";

/**
 * The hero's flying elements.
 *
 * The headline now sits in the middle of the screen with nothing beside it, so
 * the work has to come to it: four plates of the studio's own frames and three
 * instrument chips, hung off the corners of the hero and never still. They are
 * the contact sheet that used to sit in a tidy row under the headline, cut
 * loose — the same idea as `HeroField`, one scale up.
 *
 * Four layers of motion, deliberately kept on separate GSAP properties so none
 * of them has to know about the others:
 *
 * | Layer | Property | Owner |
 * | --- | --- | --- |
 * | entrance | `opacity`, `scale`, `y` | the intro timeline |
 * | scroll drift | `yPercent` | a scrubbed ScrollTrigger |
 * | idle float | `xPercent`, `yPercent` | an infinite yoyo tween |
 * | pointer parallax | `x`, `y` | `quickTo`, off the hero's pointer |
 *
 * The outer element owns the first two and the inner element the last two, so
 * a plate can be entering, drifting with the page and following the cursor in
 * the same frame without a single tween overwriting another. The resting tilt
 * is CSS `rotate`, which is its own property in the cascade and therefore
 * survives everything GSAP writes into `transform`.
 *
 * Nothing here is content. Every plate is `aria-hidden`, because the same
 * photographs are captioned properly further down the page and a screen reader
 * has no use for a decorative one.
 */

type Plate = {
  src: string;
  video?: string;
  alt: string;
  /** The reading burned into the plate's corner. */
  label: string;
  /** Position and width, phone first; `*Md` overrides from 48rem up. */
  x: string;
  y: string;
  w: string;
  xMd?: string;
  yMd?: string;
  wMd?: string;
  ratio: string;
  /** 0 = far, 1 = near. Sets pointer response and scroll drift together. */
  depth: number;
  /** Resting tilt, in degrees. */
  rotate: number;
  /** Idle float: travel as a percentage of the plate, and its period. */
  float: { x: number; y: number; seconds: number };
  className?: string;
};

/* Two plates on a phone — the top corners, well clear of the headline. The
   other two need a screen wide enough that they are not sitting on the copy. */
const PLATES: Plate[] = [
  {
    src: "/frames/strategy.webp",
    video: "/frames/strategy.mp4",
    alt: "A strategist pinning a campaign map to a wall of working notes",
    label: "Strategy",
    x: "0.5%",
    y: "2.5%",
    w: "5.25rem",
    xMd: "3.5%",
    yMd: "13%",
    wMd: "clamp(8rem, 13vw, 13rem)",
    ratio: "aspect-3/4",
    depth: 1,
    rotate: -5,
    float: { x: 1.6, y: 3.2, seconds: 7.5 },
  },
  {
    src: "/frames/review.webp",
    video: "/frames/review.mp4",
    alt: "A client review in progress across a table of printed pages",
    label: "Review",
    x: "76%",
    y: "2%",
    w: "5rem",
    xMd: "78.5%",
    yMd: "8%",
    wMd: "clamp(7rem, 11vw, 11.5rem)",
    ratio: "aspect-4/3",
    depth: 0.72,
    rotate: 6,
    float: { x: -2, y: 2.4, seconds: 9.5 },
  },
  {
    src: "/frames/reporting.webp",
    video: "/frames/reporting.mp4",
    alt: "A performance dashboard being read beside its printed weekly report",
    label: "Reporting",
    x: "10%",
    y: "60%",
    w: "7rem",
    xMd: "10.5%",
    yMd: "60%",
    wMd: "clamp(7rem, 10vw, 10rem)",
    ratio: "aspect-4/3",
    depth: 0.58,
    rotate: 4,
    float: { x: 2.4, y: -2.8, seconds: 8.5 },
    className: "hidden md:block",
  },
  {
    src: "/pillars/growth.webp",
    alt: "A media buyer reading campaign dashboards at a two-monitor desk",
    label: "ROAS",
    x: "72%",
    y: "58%",
    w: "7rem",
    /* Clear of the assistant launcher, which is fixed to the bottom-right
       corner of every page: a plate under it reads as a broken overlap. */
    xMd: "79%",
    yMd: "46%",
    wMd: "clamp(7.5rem, 12vw, 12rem)",
    ratio: "aspect-3/4",
    depth: 0.95,
    rotate: -4,
    float: { x: -1.8, y: -3, seconds: 10.5 },
    className: "hidden md:block",
  },
];

type Chip = {
  /** The reading itself — the vocabulary, not a claim about a result. */
  code: string;
  note: string;
  x: string;
  y: string;
  depth: number;
  rotate: number;
  float: { x: number; y: number; seconds: number };
};

/* The instrument tags, adrift. Wide screens only: on a phone they would be
   three more things between the visitor and the one sentence that matters. */
const CHIPS: Chip[] = [
  { code: "CVR", note: "Measured", x: "5%", y: "47%", depth: 0.4, rotate: 3, float: { x: 3, y: -4, seconds: 6.5 } },
  { code: "SOV", note: "Reported", x: "20%", y: "77%", depth: 0.65, rotate: -3, float: { x: -3.5, y: 3, seconds: 7.8 } },
  { code: "ROAS", note: "Weekly", x: "71%", y: "80%", depth: 0.85, rotate: 4, float: { x: 2.6, y: -3.4, seconds: 9 } },
];

export function HeroPlates() {
  const root = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    const hero = el?.parentElement;
    if (!el || !hero) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(el);
      const outers = q<HTMLElement>("[data-plate]");
      const inners = q<HTMLElement>("[data-plate-inner]");
      if (!outers.length) return;

      /* Arriving with the headline rather than after it: the same delay the
         hero column reads off the opening sheet, so the plates and the first
         line of type are one event. */
      const entrance = gsap.from(outers, {
        opacity: 0,
        scale: 0.82,
        y: 42,
        duration: 1.3,
        ease: "power4.out",
        stagger: 0.07,
        delay: introDelay(),
      });

      /* Each plate floats on its own period, so the field never pulses in
         unison — that is the difference between "alive" and "animated". */
      const floats = inners.map((inner) => {
        const x = Number(inner.dataset.floatX);
        const y = Number(inner.dataset.floatY);
        return gsap.to(inner, {
          xPercent: x,
          yPercent: y,
          duration: Number(inner.dataset.floatSeconds),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      /* The hero empties as it leaves: near plates rise fastest and everything
         fades, so the section hands the page over rather than scrolling off it
         as a slab. Scrubbed, so it is a pure function of scroll position. */
      const scroll = gsap.to(outers, {
        yPercent: (i) => -26 - Number(outers[i].dataset.depth) * 34,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* Pointer parallax, one `quickTo` pair per plate. `quickTo` writes into
         a single reused tween, so a pointer move costs no allocation. */
      const setters = inners.map((inner) => {
        const depth = Number(inner.dataset.depth);
        return {
          depth,
          x: gsap.quickTo(inner, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(inner, "y", { duration: 0.9, ease: "power3.out" }),
        };
      });

      const onPointer = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        const dx = (event.clientX - rect.left) / rect.width - 0.5;
        const dy = (event.clientY - rect.top) / rect.height - 0.5;
        for (const s of setters) {
          s.x(dx * -46 * s.depth);
          s.y(dy * -30 * s.depth);
        }
      };

      const onLeave = () => {
        for (const s of setters) {
          s.x(0);
          s.y(0);
        }
      };

      hero.addEventListener("pointermove", onPointer);
      hero.addEventListener("pointerleave", onLeave);

      return () => {
        hero.removeEventListener("pointermove", onPointer);
        hero.removeEventListener("pointerleave", onLeave);
        entrance.kill();
        scroll.scrollTrigger?.kill();
        scroll.kill();
        for (const float of floats) float.kill();
        ScrollTrigger.refresh();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    /* Transparent to the pointer as a whole — these hang around the headline
       and its two buttons, and a decoration must never be the thing a visitor
       clicks. The plates opt back in individually for their hover. */
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {PLATES.map((plate) => (
        <div
          key={plate.src}
          data-plate
          data-depth={plate.depth}
          className={`hero-plate ${plate.className ?? ""}`}
          style={
            {
              "--x": plate.x,
              "--y": plate.y,
              "--w": plate.w,
              "--x-md": plate.xMd,
              "--y-md": plate.yMd,
              "--w-md": plate.wMd,
            } as React.CSSProperties
          }
        >
          <div
            data-plate-inner
            data-depth={plate.depth}
            data-float-x={plate.float.x}
            data-float-y={plate.float.y}
            data-float-seconds={plate.float.seconds}
            style={{ rotate: `${plate.rotate}deg` }}
          >
            <figure
              className={`group pointer-events-auto relative ${plate.ratio} w-full overflow-hidden rounded-sheet bg-ash shadow-[0_18px_50px_-28px_rgba(14,14,15,0.5)] ring-1 ring-ink/5 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]`}
            >
              <Image
                src={plate.src}
                alt={plate.alt}
                fill
                sizes="(max-width: 768px) 30vw, 14vw"
                className="object-cover"
              />
              {plate.video && <PlateVideo src={plate.video} />}
              <figcaption className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-ink/70 to-transparent px-2 pt-6 pb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-bone">
                <span aria-hidden className="size-1 rounded-full bg-coral" />
                {plate.label}
              </figcaption>
            </figure>
          </div>
        </div>
      ))}

      {CHIPS.map((chip) => (
        <div
          key={chip.code}
          data-plate
          data-depth={chip.depth}
          className="hero-plate hidden md:block"
          style={{ "--x": chip.x, "--y": chip.y, "--w": "auto" } as React.CSSProperties}
        >
          <div
            data-plate-inner
            data-depth={chip.depth}
            data-float-x={chip.float.x}
            data-float-y={chip.float.y}
            data-float-seconds={chip.float.seconds}
            style={{ rotate: `${chip.rotate}deg` }}
          >
            <span className="flex items-center gap-2 rounded-sheet border border-ash bg-bone-2/80 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate backdrop-blur-sm">
              <span aria-hidden className="h-2.5 w-px bg-coral" />
              <span className="tabular text-ink">{chip.code}</span>
              {chip.note}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
