"use client";

import type Lenis from "lenis";
import type { LenisOptions } from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { RESPECT_REDUCED_MOTION, usePrefersReducedMotion } from "@/lib/motion";

/**
 * Smooth scrolling, and the clock everything else on the page runs on.
 *
 * Lenis and GSAP each want their own `requestAnimationFrame` loop. Left alone
 * the two interleave, so ScrollTrigger reads a scroll position that is a frame
 * stale and every parallaxed or pinned element trails the page by ~16ms — the
 * exact shimmer that makes JS scroll effects look cheap. So there is one loop:
 * GSAP's ticker drives Lenis, and Lenis pushes each new position into
 * ScrollTrigger before that same frame paints.
 *
 * Where the site honours `prefers-reduced-motion` — see `RESPECT_REDUCED_MOTION`
 * in `lib/motion.ts`, currently off — Lenis is not mounted at all. Interpolating
 * the scrollbar *is* the motion being objected to, and no amount of tuning
 * makes it acceptable to someone who asked for none.
 */

/** Module-scope handle, so the helpers below can reach the live instance. */
let instance: Lenis | null = null;

/**
 * The feel, in one place.
 *
 * `lerp` is the only number here worth arguing about, and it is the whole
 * character of the site: it is the fraction of the remaining distance the page
 * covers each frame, applied framerate-independently, so the glide is the same
 * on a 60Hz laptop and a 144Hz monitor.
 *
 * - `0.14+` — barely smoothed. Reads as a slightly mushy native scroll.
 * - `0.10` — Lenis's own default, and the feel of their demo.
 * - `0.09` — where this sits. One notch heavier than the default: long enough
 *   after the wheel stops for the parallaxed plates and the metrics tape to
 *   settle visibly, which is the point of having them.
 * - `0.06 and below` — the page keeps travelling after the visitor has stopped
 *   asking it to, and smooth becomes lag.
 */
const LENIS: LenisOptions = {
  /* Driven by the GSAP ticker in GsapBridge, not by Lenis's own loop. */
  autoRaf: false,
  lerp: 0.09,
  /* Touch already interpolates in the compositor. Smoothing it again costs a
     frame and buys nothing. */
  syncTouch: false,
  touchMultiplier: 1.6,
  /* A wheel over a scrollable child — the assistant transcript, the mobile
     menu on a short screen — scrolls that child natively instead of being
     eaten by the page scroller. Every such element on this site also carries
     `data-lenis-prevent`, which is the older, per-element spelling of the same
     intent; this is the general rule behind it, and it covers anything added
     later that nobody remembers to annotate. */
  allowNestedScroll: true,
};

/**
 * Scroll an element into view through whichever scroller is actually running.
 *
 * Native `scrollIntoView` fights Lenis: the browser jumps, Lenis eases back
 * towards where it thinks it should be, and the page lurches. Where Lenis is
 * mounted it has to own the animation.
 */
export function scrollToElement(target: Element, offset = 0) {
  if (instance) {
    instance.scrollTo(target as HTMLElement, { offset, duration: 1.1 });
    return;
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * Freeze the page behind an overlay.
 *
 * `body { overflow: hidden }` alone is not enough once Lenis is running: it
 * keeps its own scroll position and would happily animate the page underneath
 * a lightbox. Callers still set the body style as well, for the reduced-motion
 * case where there is no Lenis to stop.
 */
export function setScrollLocked(locked: boolean) {
  if (locked) instance?.stop();
  else instance?.start();
}

/**
 * Hands the running instance to GSAP.
 *
 * Lives inside the provider rather than beside it because `ReactLenis` only
 * publishes its instance on the render after it is constructed — read from a
 * ref in the parent's first effect, it is still undefined.
 */
function GsapBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    instance = lenis;

    const update = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);
      lenis.off("scroll", ScrollTrigger.update);
      instance = null;
    };
  }, [lenis]);

  return null;
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  /**
   * A route change swaps the whole document height out from under every
   * trigger. Both scrollers need telling, and the deferred frame lets the
   * incoming page commit its layout first — measured any earlier, the numbers
   * belong to the page that just left.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      instance?.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  /**
   * The CSS half of the motion policy.
   *
   * `globals.css` cannot read `RESPECT_REDUCED_MOTION`, so the decision is
   * published to the document as an attribute and every reduced-motion rule
   * hangs off it. One switch, both languages.
   */
  useEffect(() => {
    const root = document.documentElement;
    if (reduced) root.dataset.motion = "reduce";
    else delete root.dataset.motion;
  }, [reduced]);

  /* Reached only while `RESPECT_REDUCED_MOTION` is on. `reducedMotion="user"`
     is the global switch for Framer: with it, every `motion` element on the
     site drops its transform and layout animations when the visitor has asked
     for less movement, and keeps only opacity. Individual components still opt
     out of their own effects — a tilt with no transform is not a subtler tilt,
     it is a dead pointer handler — but this catches anything that would
     otherwise slip through. */
  if (reduced) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
  }

  return (
    /* `reducedMotion="never"` is the Framer half of the site's motion policy.
       Framer reads the media query itself for every `motion` element, so
       without this the animations here would go quiet on exactly the machines
       the policy is meant to keep animating. */
    <MotionConfig reducedMotion={RESPECT_REDUCED_MOTION ? "user" : "never"}>
      <ReactLenis root options={LENIS}>
        <GsapBridge />
        {children}
      </ReactLenis>
    </MotionConfig>
  );
}
