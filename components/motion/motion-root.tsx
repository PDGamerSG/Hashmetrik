"use client";

import { MotionConfig } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { RESPECT_REDUCED_MOTION, usePrefersReducedMotion } from "@/lib/motion";

/**
 * The site's motion root.
 *
 * The page scrolls natively. There used to be a smooth scroller here — Lenis,
 * interpolating the scroll position and driven off GSAP's ticker so the two
 * shared one `requestAnimationFrame` loop — and it is gone by instruction: the
 * wheel now moves the document by exactly what the operating system says, and
 * nothing sits between the two.
 *
 * Nothing built on top of the scroll had to be re-pointed. ScrollTrigger reads
 * `window.scrollY` by default, which is precisely what the smoothing used to
 * override, so the reveals, the parallaxed hero plates, the metrics tape and
 * the pinned overslide stack all still scrub — against a position the browser
 * owns rather than one a library was easing towards.
 *
 * What stays here is everything that was never about smoothing: the motion
 * policy both languages read, the refresh a client-side route change needs,
 * and the two scroll helpers the rest of the site calls.
 */

/**
 * Scroll an element into view.
 *
 * Thin enough to inline at the two call sites, and deliberately not inlined:
 * "how this site scrolls to a section" is one decision, and it is made here.
 * `scroll-padding-top` in `globals.css` is what keeps the masthead off the
 * section head — `scrollIntoView` honours it, exactly as a native anchor does,
 * so no clearance is passed in.
 */
export function scrollToElement(target: Element) {
  target.scrollIntoView({ behavior: scrollBehaviour(), block: "start" });
}

/**
 * Scroll the page back to its top.
 *
 * Eased like a section link rather than jumped, because it is the same gesture
 * — a control on the bar moving the reader somewhere on the page they are
 * already on — and the two would otherwise answer the same press in two
 * different ways.
 */
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: scrollBehaviour() });
}

/**
 * Smooth, unless the visitor asked for less motion and the site is honouring
 * that. `scroll-behavior` in `globals.css` is deliberately `auto`, since it is
 * document-wide and would ease Next.js's own scroll-to-top on every arriving
 * route; the scrolls this site asks for ask for their easing here instead.
 */
function scrollBehaviour(): ScrollBehavior {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return RESPECT_REDUCED_MOTION && reduced ? "auto" : "smooth";
}

/**
 * Freeze the page behind an overlay.
 *
 * On the **root element, never on `<body>`**. Both propagate to the viewport
 * while the other is `visible`, so either would appear to work — but a `<body>`
 * whose overflow is not visible becomes a scroll container in its own right the
 * moment anything else clamps `<html>`, and every `position: sticky` element
 * then measures against the document instead of the viewport. On a page
 * scrolled 450px the masthead pins itself to −450 and leaves the screen, taking
 * the button that closes the menu with it: the menu opens and can never be
 * closed. Setting the root is the spelling that cannot degrade into that.
 */
export function setScrollLocked(locked: boolean) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function MotionRoot({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  /**
   * A route change swaps the whole document height out from under every
   * trigger, and a client-side navigation fires neither `resize` nor `load`,
   * which are the two events ScrollTrigger refreshes itself on. The deferred
   * frame lets the incoming page commit its layout first — measured any
   * earlier, the numbers belong to the page that just left.
   */
  useEffect(() => {
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
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

  /* `reducedMotion="never"` is the Framer half of the same policy. Framer
     reads the media query itself for every `motion` element, so without this
     the animations here would go quiet on exactly the machines the policy is
     meant to keep animating. Reached the other way — with the policy on and
     the preference set — `"user"` drops transforms and keeps opacity for every
     `motion` element at once; individual components still opt out of their own
     effects, since a tilt with no transform is not a subtler tilt but a dead
     pointer handler. */
  return (
    <MotionConfig reducedMotion={RESPECT_REDUCED_MOTION ? "user" : "never"}>
      {children}
    </MotionConfig>
  );
}
