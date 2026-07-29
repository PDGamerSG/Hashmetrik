"use client";

import { useRef } from "react";
import { ActionLink } from "@/components/site/button";
import { Magnetic } from "@/components/motion/magnetic";
import { gsap, SplitText } from "@/lib/gsap";
import { introDelay, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The hero's argument, and the site's opening move.
 *
 * Centred, and alone in the middle of the screen. The intake panel used to
 * take the right-hand column, which meant the one sentence this business is
 * built on was set in two thirds of a page and read as a column of a layout.
 * The panel's content lives on `/book` at full size; what stands here now is
 * the claim, with the work flying around it.
 *
 * One timeline runs the whole column so the beats are related rather than
 * merely simultaneous: the location line arrives, the headline is set line by
 * line out from behind its own baseline, and the supporting copy and the two
 * calls to action follow it up. Nothing here waits on a scroll position —
 * this is the one block on the site that plays because the page loaded.
 *
 * The delay is read from the opening sheet's own duration at runtime, so the
 * first line begins as the sheet clears it. On a client-side return to the
 * home page the sheet is long gone, `introDelay` returns zero, and the
 * headline plays immediately instead of leaving a blank second behind.
 * `HeroPlates` reads the same figure, so the type and the frames arrive as one
 * event rather than two.
 */
export function HeroLead() {
  const root = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const q = gsap.utils.selector(el);
      const heading = q("h1")[0];
      if (!heading) return;

      /* `autoSplit` re-splits when the webfont lands or the column changes
         width. Without the latch that would replay the entrance on every
         resize, so the re-split silently re-establishes the finished state
         instead. */
      let played = false;

      const split = SplitText.create(heading, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit: (self) => {
          if (played) return;
          played = true;

          return gsap
            .timeline({ delay: introDelay() })
            .from(q("[data-hero='eyebrow']"), { opacity: 0, y: 10, duration: 0.7 }, 0)
            .from(
              self.lines,
              { yPercent: 130, duration: 1.15, ease: "power4.out", stagger: 0.085 },
              0.06,
            )
            /* The rule under the claim draws itself out from the centre as the
               last line settles — the one flourish in the block, and it is
               still a measuring mark rather than an ornament. */
            .from(
              q("[data-hero='rule']"),
              { scaleX: 0, duration: 1.1, ease: "power4.out" },
              0.45,
            )
            .from(
              q("[data-hero='follow']"),
              { opacity: 0, y: 16, duration: 0.8, stagger: 0.09 },
              0.5,
            );
        },
      });

      return () => split.revert();
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="relative z-10 flex flex-col items-center text-center">
      <p
        data-hero="eyebrow"
        className="flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-slate"
      >
        <span className="text-coral">Hyderabad</span>
        <span aria-hidden className="hidden h-px w-8 bg-ash sm:block" />
        <span>Brand · Web · Marketing · PR</span>
      </p>

      {/* The thesis, in three beats. The serif italic lands on the only word
          that is a claim rather than a description: *one* partner, not six
          retainers with six invoices.

          Sized against width *and* viewport height. On a 1366×768 laptop the
          hero is a full screen with plates in its corners, and a headline set
          on width alone pushes the booking CTA past the fold on the one screen
          size where the fold is the whole argument. */}
      <h1 className="mt-6 max-w-5xl font-display text-[clamp(2.5rem,min(8vw,10.5vh),6.5rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-balance">
        <span className="block">Everything your brand needs.</span>
        <span className="block text-ink/35">
          <em className="font-editorial pr-[0.06em] font-normal tracking-[-0.02em] text-coral">
            One
          </em>{" "}
          growth partner.
        </span>
      </h1>

      <span
        data-hero="rule"
        aria-hidden
        className="mt-7 h-px w-24 origin-center bg-gradient-to-r from-transparent via-coral to-transparent md:mt-9 md:w-40"
      />

      <p
        data-hero="follow"
        className="mt-7 max-w-2xl text-base leading-relaxed text-balance text-slate md:text-lg"
      >
        Brand foundation, digital presence, marketing growth and brand reach — built as one
        customised package, run by one senior team, and reported as one set of numbers you can
        check line by line.
      </p>

      <div
        data-hero="follow"
        className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
      >
        <Magnetic className="w-full sm:w-auto">
          <ActionLink href="/book" className="h-14 w-full px-7">
            Book a free consultation
          </ActionLink>
        </Magnetic>
        <Magnetic className="w-full sm:w-auto">
          <ActionLink href="/#package" variant="outline" className="h-14 w-full px-7" arrow={false}>
            See the package
          </ActionLink>
        </Magnetic>
      </div>
    </div>
  );
}
