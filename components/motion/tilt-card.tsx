"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { POINTER_SPRING, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A card that turns to face the pointer.
 *
 * The effect is built from three cheap layers rather than one expensive one:
 * a rotation on the card, a specular sheen that tracks the cursor, and a soft
 * coral bloom behind the edge nearest it. All three are driven by the same
 * pair of motion values, so there is one spring doing the work and no React
 * re-render per mouse move — the values are written straight to the
 * compositor.
 *
 * The tilt is deliberately shallow. On an editorial layout a card that swings
 * fifteen degrees stops looking like paper and starts looking like a demo.
 */

export function TiltCard({
  children,
  className,
  /** Maximum rotation in degrees, on each axis. */
  max = 7,
  /** Lift, in px, while the pointer is over the card. */
  lift = 6,
  glow = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  lift?: number;
  glow?: boolean;
}) {
  const reduced = usePrefersReducedMotion();

  /* Tilting on a touchscreen means tilting on tap, which fights the scroll and
     leaves the card stuck at an angle with no pointer to leave. */
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Normalised pointer position within the card, 0–1 on each axis. */
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);

  const sx = useSpring(px, POINTER_SPRING);
  const sy = useSpring(py, POINTER_SPRING);
  const sh = useSpring(hover, { stiffness: 180, damping: 30 });

  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const z = useTransform(sh, [0, 1], [0, lift]);

  const glowX = useTransform(sx, (v) => `${v * 100}%`);
  const glowY = useTransform(sy, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(30rem 30rem at ${glowX} ${glowY}, rgba(255,255,255,0.55), transparent 60%)`;
  const bloom = useMotionTemplate`radial-gradient(18rem 18rem at ${glowX} ${glowY}, var(--color-coral), transparent 70%)`;
  const sheenOpacity = useTransform(sh, [0, 1], [0, 0.3]);
  const bloomOpacity = useTransform(sh, [0, 1], [0, 0.5]);

  const active = fine && !reduced;

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!active) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }

  function handleLeave() {
    hover.set(0);
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div
      /* Perspective lives on the wrapper, not the card: applied to the card
         itself it would be recalculated from the card's own centre after every
         rotation, and the tilt would wobble. */
      style={{ perspective: active ? 1100 : undefined }}
      onPointerMove={handleMove}
      onPointerEnter={() => active && hover.set(1)}
      onPointerLeave={handleLeave}
      className={cn("relative", className)}
    >
      <motion.div
        style={
          active
            ? { rotateX, rotateY, z, transformStyle: "preserve-3d" }
            : undefined
        }
        className="relative h-full"
      >
        {glow && active && (
          <>
            {/* Bloom sits behind the card and only shows past its edge. */}
            <motion.div
              aria-hidden
              style={{ background: bloom, opacity: bloomOpacity }}
              className="pointer-events-none absolute -inset-3 -z-10 rounded-sheet blur-2xl"
            />
            {/* Sheen sits above it, clipped to the card, in screen blend so it
                lightens the photograph without washing out the caption. */}
            <motion.div
              aria-hidden
              style={{ background: sheen, opacity: sheenOpacity }}
              className="pointer-events-none absolute inset-0 z-10 rounded-sheet mix-blend-screen"
            />
          </>
        )}
        {children}
      </motion.div>
    </div>
  );
}
