"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import {
  MOTION_QUERY,
  useIsomorphicLayoutEffect,
  type MotionTag,
  type MotionTagElement,
} from "@/lib/motion";

/**
 * Scroll entrances.
 *
 * Three rules hold across the whole site:
 *
 * 1. **Content is visible without JavaScript.** These are `gsap.from` tweens,
 *    so the finished state is what the server sent. If the bundle never
 *    arrives, or the visitor asked for reduced motion, the page simply reads.
 * 2. **Transform and opacity only.** Nothing here touches a property that
 *    forces layout, so the whole entrance runs on the compositor.
 * 3. **Once.** A block that re-animates every time it re-enters the viewport
 *    turns a long page into a slideshow. Entrances fire on the way down and
 *    stay put.
 */

type RevealProps = {
  as?: MotionTag;
  className?: string;
  children: ReactNode;
  /** Travel distance in px. Larger blocks want more, small labels want less. */
  y?: number;
  /** Scale up from just under full size. Reads as depth rather than growth. */
  scale?: number;
  /**
   * Animate the direct children in sequence instead of the element itself,
   * by this many seconds apart. Use for grids and lists.
   */
  stagger?: number;
  delay?: number;
  duration?: number;
  /** ScrollTrigger start. The default fires a little before the block lands. */
  start?: string;
};

export function Reveal({
  as = "div",
  className,
  children,
  y = 28,
  scale,
  stagger,
  delay = 0,
  duration = 1,
  start = "top 88%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    /* matchMedia rather than an early return: the preference can change while
       the page is open, and reverting restores the finished state exactly. */
    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY, () => {
      const targets = stagger ? Array.from(el.children) : el;

      gsap.from(targets, {
        opacity: 0,
        y,
        ...(scale ? { scale } : null),
        duration,
        delay,
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
    });

    return () => mm.revert();
  }, []);

  const Tag = as as MotionTagElement;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

type ParallaxProps = {
  as?: MotionTag;
  className?: string;
  children: ReactNode;
  /**
   * Fraction of the element's own height to drift across the full scroll of
   * it past the viewport. Positive lags behind the page, negative leads it.
   * Past about 0.25 the effect stops reading as depth and starts reading as
   * a bug, so the useful range is small.
   */
  speed?: number;
};

/**
 * Depth by differential speed.
 *
 * Scrubbed rather than tweened: the element's position is a pure function of
 * scroll offset, so there is no easing to fight the scroll and nothing to
 * settle when the visitor stops.
 */
export function Parallax({ as = "div", className, children, speed = 0.12 }: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    /* Wide screens only. On a phone the viewport is so much taller than these
       elements that the drift either does nothing or pushes them off their
       own layout box. */
    mm.add(
      { motion: MOTION_QUERY, wide: "(min-width: 768px)" },
      (context) => {
        if (!context.conditions?.motion || !context.conditions?.wide) return;

        gsap.fromTo(
          el,
          { yPercent: -speed * 50 },
          {
            yPercent: speed * 50,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      },
    );

    return () => mm.revert();
  }, [speed]);

  const Tag = as as MotionTagElement;
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
