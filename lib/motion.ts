"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { ElementType, Ref } from "react";

/**
 * Motion vocabulary.
 *
 * The site already has one easing curve in CSS (`--ease-out-quint`). These are
 * the same curve expressed for GSAP and for Framer Motion, so a fade written
 * in CSS and a tilt written in JS decelerate identically. A house style in
 * motion is worth as much as one in type.
 */

/**
 * Whether the site honours `prefers-reduced-motion`.
 *
 * Set to `false` at the client's instruction: the site now animates for every
 * visitor, including those whose operating system asks for less movement.
 *
 * This is a real accessibility trade — the preference exists because motion
 * makes some people ill, and on Windows it is the same toggle as "Animation
 * effects", which many people turn off for reasons that have nothing to do
 * with the web. It is a decision rather than an oversight, so it is written
 * down here as one line rather than deleted from a dozen components: flip this
 * back to `true` and every guard below, in `globals.css`, and in every GSAP
 * `matchMedia` on the site starts respecting the preference again. Nothing
 * else has to change.
 */
export const RESPECT_REDUCED_MOTION = false;

/**
 * The media query every animated component registers under.
 *
 * `all` matches unconditionally, which is what makes the switch above work
 * without rewriting a single `matchMedia` block.
 */
export const MOTION_QUERY = RESPECT_REDUCED_MOTION
  ? "(prefers-reduced-motion: no-preference)"
  : "all";

/** The complement — for the handful of blocks that set up a *still* version. */
export const REDUCED_QUERY = RESPECT_REDUCED_MOTION
  ? "(prefers-reduced-motion: reduce)"
  : "not all";

/** `cubic-bezier(0.22, 1, 0.36, 1)` — the site's single deceleration curve. */
export const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** The GSAP spelling of the same shape. */
export const GSAP_EASE = "power3.out";

/** Spring used for anything that follows a pointer: tilt, glare, magnetism. */
export const POINTER_SPRING = { stiffness: 200, damping: 28, mass: 0.6 } as const;

/**
 * `useLayoutEffect` that does not warn during the server render.
 *
 * GSAP set-up has to run before paint or the "from" state of a reveal is
 * visible for one frame as a flash of finished content.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * How long the hero should wait before it starts, in seconds.
 *
 * The opening sheet is pure CSS and its length lives in `--intro-duration`,
 * so this reads that value off the document rather than repeating it. What is
 * returned is the time *remaining*, measured against the page's own clock:
 *
 * - On a first load with slow hydration, the sheet is already part-way
 *   through its lift and the hero waits only for what is left of it.
 * - On a client-side navigation back to the home page the sheet is long gone,
 *   `performance.now()` is past it, and the hero plays immediately.
 *
 * A hard-coded delay gets the first case slightly wrong and the second case
 * badly wrong — a headline that sits blank for a second on every return.
 */
export function introDelay(extra = 0.15) {
  if (typeof window === "undefined") return extra;

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--intro-duration")
    .trim();
  const total = raw.endsWith("ms") ? parseFloat(raw) / 1000 : parseFloat(raw) || 0;

  const remaining = total - performance.now() / 1000;
  return remaining > 0 ? remaining + extra : 0;
}

/**
 * `false` during the server render, `true` once on the client.
 *
 * Anything portalled into `document.body` — the lightbox, the cursor preview —
 * needs this, and the obvious `useState(false)` plus `useEffect(() => set(true))`
 * costs a second render pass on mount for a value that is constant per
 * environment. This reads it as what it actually is: state that lives outside
 * React and never changes.
 */
const neverChanges = () => () => {};

export function useIsMounted() {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

/**
 * `true` once the page's own load event has fired.
 *
 * For anything that wants to wait its turn rather than compete with the first
 * screen — currently the phone side of `PlateVideo`, where the hero's clips sit
 * inside the fold and would otherwise pull a megabyte of video across the
 * moment the observer sees them.
 *
 * Same shape as `useIsMounted` and for the same reason: this is state that
 * lives on `document`, not in React, and reading it through an effect means a
 * render pass and a lint rule about cascading renders. `false` on the server,
 * and on a load that has already finished the first client read is `true`, so
 * a client-side navigation never waits.
 */
const subscribeToLoad = (onChange: () => void) => {
  window.addEventListener("load", onChange, { once: true });
  return () => window.removeEventListener("load", onChange);
};

export function usePageLoaded() {
  return useSyncExternalStore(
    subscribeToLoad,
    () => document.readyState === "complete",
    () => false,
  );
}

/**
 * The elements the polymorphic motion wrappers may render as.
 *
 * A closed list rather than `keyof JSX.IntrinsicElements`, because the whole
 * point of the `as` prop here is to keep list semantics — a stagger over a
 * grid has to render `ul`/`li`, or the relationship between the list and its
 * items is lost to a screen reader. Nothing in this set has behaviour of its
 * own to interfere with.
 */
export type MotionTag =
  | "div"
  | "section"
  | "article"
  | "aside"
  | "figure"
  | "ul"
  | "ol"
  | "li"
  | "p"
  | "span"
  | "h1"
  | "h2"
  | "h3"
  | "h4";

/**
 * `MotionTag` narrowed to something a ref can actually be handed to.
 *
 * The union above has fourteen mutually incompatible `ref` types, so
 * TypeScript will not accept a single ref against all of them at once. Every
 * member is a host element rendering an `HTMLElement`, which is what a cast to
 * this type asserts — and the closed union is what makes the assertion safe.
 *
 * Used as `const Tag = as as MotionTagElement`. Deliberately a type rather
 * than a helper function: a call in the render body reads to the React
 * compiler as a component being constructed on every render.
 */
export type MotionTagElement = ElementType<{ ref?: Ref<HTMLElement>; className?: string }>;

/**
 * Live reduced-motion preference, as the site chooses to act on it.
 *
 * Constant `false` while `RESPECT_REDUCED_MOTION` is off — the whole point of
 * the switch is that no caller has to know about it. The hook shape is kept so
 * that turning the policy back on needs no changes here or at any call site.
 *
 * When it is on: returns `false` on the server and for the first client frame,
 * then settles. Callers must therefore treat "no preference" as the state to
 * animate *into*, never as a reason to hide content.
 *
 * Every component on this site reads this rather than Framer's
 * `useReducedMotion`, which goes straight to the media query and would ignore
 * the policy above.
 */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!RESPECT_REDUCED_MOTION) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
