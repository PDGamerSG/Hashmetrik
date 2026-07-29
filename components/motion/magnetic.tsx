"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A control that leans towards the pointer.
 *
 * The pull is clamped to a few pixels, and the element springs back the moment
 * the pointer leaves. That restraint is what keeps it usable: a button that
 * chases the cursor across half its own width becomes harder to click, which
 * is a strange price to pay for an effect meant to make it feel eager.
 *
 * Pointer-fine only. On touch there is no hover state to reward, and the
 * transform would only fire after the tap has already landed.
 */
export function Magnetic({
  children,
  className,
  /** Maximum travel in px. */
  strength = 6,
}: {
  children: ReactNode;
  className?: string;
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
  const sx = useSpring(x, { stiffness: 260, damping: 22, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 260, damping: 22, mass: 0.5 });

  const active = fine && !reduced;

  return (
    <motion.span
      style={active ? { x: sx, y: sy } : undefined}
      onPointerMove={(event) => {
        if (!active) return;
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
        y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.span>
  );
}
