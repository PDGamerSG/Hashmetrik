"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { MOTION_QUERY, introDelay, useIsomorphicLayoutEffect } from "@/lib/motion";
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

/* Two plates on a phone — the top corners, whole, and inside the frame.
 *
 * They used to hang off the hero's top edge and be cut by its
 * `overflow-hidden`. That is the right idea on a wide screen, where the crop
 * reads as a contact sheet running past the edge of the paper. On a phone it
 * reads as a mistake: the band above the headline is only a few rem tall, so
 * what survived the cut was a strip with no top to it, sitting under a bar that
 * had already taken the rest.
 *
 * So the phone offsets are positive, and the plates are sized to fit the band
 * rather than to overflow it. Both are 5rem wide, both start 0.625rem below the
 * hero's top edge, and both are hung on the same gutter the type is set to —
 * one box each, mirrored, whole. The 0.625rem is not decoration: these are
 * rotated 5-6°, which lifts a corner about 4px above the box's own top, and
 * that corner is what the hero would otherwise clip.
 *
 * Fitting the band is why `Strategy` is 4:3 here and 3:4 only from `md` up. It
 * is a portrait plate, and portrait at any width wide enough to read is taller
 * than the band has room for — the alternative was a 3rem stamp. A landscape
 * crop of the same frame keeps it legible at a size that fits, and both plates
 * then share a height, so their tops and bottoms line up instead of nearly
 * lining up.
 *
 * The band itself is the hero column's top padding. The column is centred, so
 * the gap above the eyebrow is whatever the viewport has left over, and on a
 * short screen that collapses to the padding and nothing more. `pt-22` there
 * is the guaranteed 5.5rem: 0.625rem of air, 3.75rem of plate, and the rest
 * between the plates and the first line of type.
 *
 * The other two plates, and the chips below, wait for `lg` rather than `md`.
 * Their positions are percentages while the copy they have to miss is a column
 * with a maximum width, so the gutter they live in only opens up as the screen
 * grows — and at 768, the narrowest screen `md` covers, it has not opened yet.
 * Measured there: the ROAS plate and the CVR chip both sat on the body
 * paragraph and the Reporting plate came out from under the primary button. A
 * tablet in portrait gets the same two plates a phone does, at the size the
 * screen can carry. */
const PLATES: Plate[] = [
  {
    src: "/frames/strategy.webp",
    video: "/frames/strategy.mp4",
    alt: "A strategist pinning a campaign map to a wall of working notes",
    label: "Strategy",
    x: "var(--shell-pad)",
    y: "0.625rem",
    w: "5rem",
    /* High and tight to the left edge. It is the tallest plate on the page and
       the only one whose corner can reach the script `One`, which is the one
       word in the headline that cannot afford a photograph behind it — the
       offsets here are the ones that clear it at 768, where the gutter is
       narrowest, rather than only at desktop widths. */
    xMd: "2.5%",
    yMd: "9%",
    wMd: "clamp(8rem, 13vw, 13rem)",
    /* Landscape on a phone so it fits the band whole — see the note above. */
    ratio: "aspect-4/3 md:aspect-3/4",
    depth: 1,
    rotate: -5,
    float: { x: 1.6, y: 3.2, seconds: 7.5 },
  },
  {
    src: "/frames/review.webp",
    video: "/frames/review.mp4",
    alt: "A client review in progress across a table of printed pages",
    label: "Review",
    /* The same box on the opposite gutter. */
    x: "calc(100% - var(--shell-pad) - 5rem)",
    y: "0.625rem",
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
    className: "hidden lg:block",
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
    className: "hidden lg:block",
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

/* The instrument tags, adrift. Wide screens only — see the note above the
   plates: on a phone they would be three more things between the visitor and
   the one sentence that matters, and on a tablet in portrait the leftmost of
   them lands on the paragraph. */
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

    mm.add(MOTION_QUERY, () => {
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

      /* The hero empties as it leaves: near plates rise fastest and the whole
         field fades, so the section hands the page over rather than scrolling
         off it as a slab. Scrubbed, so it is a pure function of scroll
         position — including on the way back up.

         The rise and the fade are deliberately on different elements. Both the
         entrance above and this fade would otherwise be writing `opacity` on
         the same plates, and a scrubbed tween records its start value when it
         is *created* — which is mid-entrance, with the plates still at zero.
         Scrolling back to the top then restored that zero and the field never
         came back. So the plates own their opacity and the container owns the
         fade, and neither has to know about the other. */
      const trigger = {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
      } as const;

      const rise = gsap.to(outers, {
        yPercent: (i) => -26 - Number(outers[i].dataset.depth) * 34,
        ease: "none",
        scrollTrigger: trigger,
      });

      const fade = gsap.to(el, {
        opacity: 0.12,
        ease: "none",
        scrollTrigger: trigger,
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
        rise.scrollTrigger?.kill();
        rise.kill();
        fade.scrollTrigger?.kill();
        fade.kill();
        gsap.set(el, { clearProps: "opacity" });
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
              {/* On a phone this is two clips, not four: the plates that carry
                  the other two are `hidden md:block`, so their observers never
                  fire and their sources are never fetched. See `PlateVideo`. */}
              {plate.video && <PlateVideo src={plate.video} onPhone />}
              <figcaption className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 bg-gradient-to-t from-ink/70 to-transparent px-2 pt-6 pb-1.5 label-xs text-bone">
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
          className="hero-plate hidden lg:block"
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
            <span className="flex items-center gap-2 rounded-sheet border border-ash bg-bone-2/80 px-2.5 py-1.5 label-sm text-slate backdrop-blur-sm">
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
