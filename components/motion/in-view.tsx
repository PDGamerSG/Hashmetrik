"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_QUINT } from "@/lib/motion";

/**
 * An entrance driven by visibility rather than by scroll position.
 *
 * ScrollTrigger is the right tool almost everywhere on this page, but not
 * inside the overslide stack: those panels are `position: sticky`, so their
 * offset from the top of the document stops matching where they actually are,
 * and a trigger computed from geometry either fires early or never fires.
 * IntersectionObserver asks the browser the only question that still has a
 * reliable answer there — *is this on screen?* — which is what Framer's
 * `whileInView` is built on.
 *
 * `once` throughout: a stack the visitor scrolls back up through should be
 * a stack, not a set of animations rearming behind them.
 */
export function InView({
  children,
  className,
  y = 20,
  delay = 0,
  duration = 0.75,
  /** Fraction of the element that must be visible before it plays. */
  amount = 0.3,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
  duration?: number;
  amount?: number;
}) {
  /* `initial={false}` rather than a zero-duration transition: that way the
     element is never written to the DOM at opacity 0 at all, so nothing
     depends on an IntersectionObserver firing to make the page readable. */
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE_OUT_QUINT }}
    >
      {children}
    </motion.div>
  );
}

/**
 * The same entrance, applied to a list one item at a time.
 *
 * Rendered as a `ul` with each child a `motion.li`, so the stagger does not
 * cost a wrapper element per row — in a list of six services that is six
 * divs that would otherwise sit between the list and its items and break the
 * `ul > li` relationship a screen reader relies on.
 */
export function InViewList({
  items,
  className,
  itemClassName,
  step = 0.07,
  delay = 0.1,
  amount = 0.25,
}: {
  items: { key: string; content: ReactNode }[];
  className?: string;
  itemClassName?: string;
  step?: number;
  delay?: number;
  amount?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.ul
      className={className}
      initial={reduced ? false : "hidden"}
      whileInView="shown"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: step, delayChildren: delay } },
      }}
    >
      {items.map((item) => (
        <motion.li
          key={item.key}
          className={itemClassName}
          variants={{
            hidden: { opacity: 0, y: 14 },
            shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_QUINT } },
          }}
        >
          {item.content}
        </motion.li>
      ))}
    </motion.ul>
  );
}
