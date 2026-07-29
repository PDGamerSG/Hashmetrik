"use client";

import { useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import {
  MOTION_QUERY,
  useIsomorphicLayoutEffect,
  type MotionTag,
  type MotionTagElement,
} from "@/lib/motion";

/**
 * A heading whose lines rise out from behind their own baseline.
 *
 * The line is wrapped in a clipping mask and starts fully below it, so what
 * the eye sees is type being set rather than a block sliding in. It is the
 * one entrance on the site that draws attention to itself, which is why it is
 * reserved for the two or three headlines that carry the argument.
 *
 * Two details make this safe to use on real copy:
 *
 * - `autoSplit` re-splits after webfonts load and on resize. Splitting before
 *   Bricolage arrives would measure line breaks in the fallback face and leave
 *   masks in the wrong places for the rest of the session.
 * - SplitText writes the original text to `aria-label` and hides the wrapper
 *   spans, so a screen reader hears one heading rather than four fragments.
 */

type SplitHeadingProps = {
  as?: MotionTag;
  className?: string;
  children: ReactNode;
  /** `load` for the hero, `scroll` for headings further down the page. */
  on?: "load" | "scroll";
  delay?: number;
  stagger?: number;
};

export function SplitHeading({
  as = "h2",
  className,
  children,
  on = "scroll",
  delay = 0,
  stagger = 0.09,
}: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY, () => {
      const split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        /* Descenders and the serif italic's overshoot both fall outside the
           line box; without the padding the mask clips them. */
        linesClass: "split-line",
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 115,
            duration: 1.1,
            ease: "power4.out",
            stagger,
            delay,
            ...(on === "scroll"
              ? { scrollTrigger: { trigger: el, start: "top 85%", once: true } }
              : null),
          }),
      });

      return () => split.revert();
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
