"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { EASE_OUT_QUINT, useIsMounted } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A list where the row under the pointer shows itself.
 *
 * The alternative — a thumbnail in every row — would put six photographs on
 * screen at once and turn a legible index into a gallery. Here the list stays
 * a list, and the image is summoned only for the row being read. It trails the
 * cursor on a spring and banks into the direction of travel, so it behaves
 * like something being carried rather than something being teleported.
 *
 * Strictly an enhancement: the surface is `aria-hidden`, nothing about the
 * list depends on it, and it never mounts on a touch device or under reduced
 * motion, where there is no hover to respond to in the first place.
 */

type PreviewContext = {
  show: (src: string) => void;
  hide: (src: string) => void;
  track: (x: number, y: number) => void;
  active: boolean;
};

const Ctx = createContext<PreviewContext | null>(null);

export function CursorPreviewSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [fine, setFine] = useState(false);
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const active = fine && !reduced;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 320, damping: 34, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 320, damping: 34, mass: 0.7 });

  /* Lag between the pointer and the card, expressed as a bank angle. The card
     leans into the turn and settles level the instant the cursor stops. */
  const tilt = useTransform(() => clampTilt((x.get() - sx.get()) * 0.12));
  const stilt = useSpring(tilt, { stiffness: 220, damping: 26 });

  const value: PreviewContext = {
    active,
    show: setSrc,
    hide: (leaving) => setSrc((current) => (current === leaving ? null : current)),
    track: (px, py) => {
      x.set(px);
      y.set(py);
    },
  };

  /* Portalled to the body. The card is `position: fixed`, and any ancestor
     that gains a transform — a parallax wrapper, a GSAP tween mid-flight —
     would silently become its containing block and drag it around the page. */
  const mounted = useIsMounted();

  const card = (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy, rotate: stilt }}
      className="pointer-events-none fixed top-0 left-0 z-40 hidden md:block"
    >
      <AnimatePresence>
        {src && (
          <motion.div
            key={src}
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.32, ease: EASE_OUT_QUINT }}
            /* Centred on the pointer here rather than in the spring, so the
               offset is a constant and only the position is animated. */
            className="relative -mt-24 -ml-34 h-48 w-68 overflow-hidden rounded-sheet shadow-[0_1.5rem_3rem_-1rem_rgba(0,0,0,0.55)]"
          >
            <Image src={src} alt="" fill sizes="17rem" className="object-cover" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <Ctx.Provider value={value}>
      <div className={className}>{children}</div>
      {active && mounted && createPortal(card, document.body)}
    </Ctx.Provider>
  );
}

/** Keeps the bank angle within a few degrees whatever the pointer speed. */
function clampTilt(value: number) {
  return Math.max(-9, Math.min(9, value));
}

export function CursorPreviewTrigger({
  src,
  children,
  className,
  as = "div",
}: {
  src: string;
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const ctx = useContext(Ctx);

  const handlers = ctx?.active
    ? {
        onPointerEnter: () => ctx.show(src),
        onPointerLeave: () => ctx.hide(src),
        onPointerMove: (event: React.PointerEvent) => ctx.track(event.clientX, event.clientY),
      }
    : null;

  return createElement(as, { className: cn(className), ...handlers }, children);
}
