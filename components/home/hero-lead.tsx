"use client";

import { useRef } from "react";
import { ActionLink } from "@/components/site/button";
import { Magnetic } from "@/components/motion/magnetic";
import { gsap, SplitText } from "@/lib/gsap";
import { introDelay, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The hero's argument, and the site's opening move.
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
    <div ref={root}>
      <p
        data-hero="eyebrow"
        className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.28em] text-slate"
      >
        <span className="text-coral">Hyderabad</span>
        <span aria-hidden className="hidden h-px w-8 bg-ash sm:block" />
        <span>Brand · Web · Marketing · PR</span>
      </p>

      {/* The thesis, in three beats. The serif italic lands on the only word
          that is a claim rather than a description: *one* partner, not six
          retainers with six invoices.

          The size is capped three ways. Against width and against viewport
          *height*, because sized on width alone a 1366×768 laptop pushes the
          headline so far down that the booking CTA falls below the fold — and
          then against an absolute ceiling, because the longest line has to
          survive in the measure left beside the instrument panel. Set any
          larger and "One growth partner." breaks across two lines, which
          turns a three-beat argument into a five-line wall. */}
      <h1 className="mt-5 font-display text-[clamp(2.25rem,min(7vw,10.5vh),5.75rem)] leading-[0.9] font-semibold tracking-[-0.045em]">
        <span className="block">Everything your</span>
        <span className="block">brand needs.</span>
        <span className="block text-ink/35">
          <em className="font-editorial pr-[0.06em] font-normal tracking-[-0.02em] text-coral">
            One
          </em>{" "}
          growth partner.
        </span>
      </h1>

      {/* Two-up only in the middle range. Once the panel takes the right
          column there is no longer the measure for a second column here. */}
      <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-[1.1fr_minmax(0,1fr)] md:items-end xl:grid-cols-1 xl:items-start">
        <p data-hero="follow" className="max-w-xl text-lg leading-relaxed text-slate md:text-xl">
          Brand foundation, digital presence, marketing growth and brand reach — built as one
          customised package, run by one senior team, and reported as one set of numbers you can
          check line by line.
        </p>

        <div data-hero="follow" className="flex flex-col gap-3 sm:flex-row md:justify-end xl:justify-start">
          <Magnetic className="w-full sm:w-auto">
            <ActionLink href="/book" className="h-14 w-full px-7">
              Book a free consultation
            </ActionLink>
          </Magnetic>
          <Magnetic className="w-full sm:w-auto">
            <ActionLink
              href="/#package"
              variant="outline"
              className="h-14 w-full px-7"
              arrow={false}
            >
              See the package
            </ActionLink>
          </Magnetic>
        </div>
      </div>
    </div>
  );
}
