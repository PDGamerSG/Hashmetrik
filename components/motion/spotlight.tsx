"use client";

import { useEffect, useState } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import { POINTER_SPRING, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A pool of light that follows the pointer across its parent.
 *
 * The same idea as the sheen inside `TiltCard`, lifted out for the blocks that
 * want the response without the rotation — a list of four claims should answer
 * the pointer, but it should not tip over. Drop it into any `relative`
 * container and it fills it: the layer covers the card, so it sees every move,
 * and the card's own text sits above it in the stack.
 *
 * It is deliberately faint. This page is paper, and the strongest thing a light
 * can do to paper is warm one corner of it; anything brighter turns the surface
 * into glass and the system stops agreeing with itself.
 *
 * Pointer-only, like every other hover treatment here: on a touchscreen there
 * is no pointer to follow, so nothing mounts and nothing listens.
 */
export function Spotlight({
  className,
  /** Diameter of the pool, in rem. */
  size = 22,
  /** Colour at the centre. A token, so ink and bone surfaces can differ. */
  color = "var(--color-coral)",
  /** Peak alpha. Past about 0.12 this stops reading as light on paper. */
  strength = 0.08,
}: {
  className?: string;
  size?: number;
  color?: string;
  strength?: number;
}) {
  const reduced = usePrefersReducedMotion();

  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const on = useMotionValue(0);

  /* The pool lags the cursor very slightly. Locked to it exactly it reads as a
     cursor decoration; a beat behind, it reads as light being carried. */
  const sx = useSpring(x, POINTER_SPRING);
  const sy = useSpring(y, POINTER_SPRING);
  const opacity = useSpring(on, { stiffness: 160, damping: 30 });

  const background = useMotionTemplate`radial-gradient(${size}rem ${size}rem at ${sx}px ${sy}px, color-mix(in oklab, ${color} ${strength * 100}%, transparent) 0%, transparent 72%)`;

  if (!fine || reduced) return null;

  return (
    <motion.div
      aria-hidden
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left);
        y.set(event.clientY - rect.top);
      }}
      onPointerEnter={() => on.set(1)}
      onPointerLeave={() => on.set(0)}
      style={{ background, opacity }}
      className={cn("absolute inset-0", className)}
    />
  );
}
