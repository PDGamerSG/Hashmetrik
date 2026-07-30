"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsMounted, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { PlateVideo } from "@/components/motion/plate-video";
import { setScrollLocked } from "@/components/motion/smooth-scroll";

/**
 * An image that magnifies under the pointer and opens to full size on click.
 *
 * Two behaviours, one component, because they answer the same question at
 * different levels of commitment: *what is in this photograph?* Hover gives a
 * loupe — the image scales about the point under the cursor, so moving the
 * mouse pans the magnified view rather than dragging the whole picture across
 * its frame. Click commits to it, and the thumbnail morphs into the full-bleed
 * view instead of being replaced by one, so the visitor never loses the thread.
 *
 * The morph is a shared-layout animation: one `layoutId` on both the small and
 * the large image, and the browser interpolates between their boxes. Nothing
 * is cross-faded, and the same DOM node is on screen throughout.
 *
 * A `video` puts a clip over the thumbnail. It goes inside the magnified span
 * rather than beside it, so the loupe pans the moving frame on exactly the same
 * transform — one node, one origin, no second thing to keep in register. The
 * lightbox stays photographic: at full size the question is what is in the
 * frame, and a loop playing under the answer is just noise.
 */

export function ImageZoom({
  src,
  alt,
  video,
  sizes = "(max-width: 1024px) 45vw, 22vw",
  caption,
  className,
  /**
   * The lightbox's shape. Landscape by default; a portrait plate has to say
   * so, or the full-size view crops harder than the thumbnail it grew from.
   */
  zoomClassName = "aspect-4/3 w-full max-w-5xl",
  /** Magnification under the pointer. Past ~2 the source resolution shows. */
  zoomScale = 1.7,
  priority,
  /** Passed through to the clip. See `PlateVideo`. */
  videoOnPhone = false,
}: {
  src: string;
  alt: string;
  video?: string;
  sizes?: string;
  caption?: string;
  className?: string;
  zoomClassName?: string;
  zoomScale?: number;
  priority?: boolean;
  videoOnPhone?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const layoutId = useId();
  const [open, setOpen] = useState(false);
  const mounted = useIsMounted();

  /* Origin of the magnification, as a percentage of the frame, plus the
     magnification itself. Both are springs: a flick of the wrist should pan
     the loupe, not whip it. */
  const ox = useMotionValue(50);
  const oy = useMotionValue(50);
  const zoom = useMotionValue(1);
  const spring = { stiffness: 240, damping: 32, mass: 0.6 };
  const sox = useSpring(ox, spring);
  const soy = useSpring(oy, spring);
  const scale = useSpring(zoom, spring);
  const origin = useMotionTemplate`${sox}% ${soy}%`;

  const close = useCallback(() => setOpen(false), []);

  /* The lightbox owns the viewport while it is up: the page behind must not
     scroll — under Lenis that means stopping the scroller too, not just the
     body — and Escape must always be the way out. */
  useEffect(() => {
    if (!open) return;
    setScrollLocked(true);
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("keydown", onKey);

    return () => {
      setScrollLocked(false);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function handleMove(event: React.PointerEvent<HTMLElement>) {
    if (reduced || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    ox.set(((event.clientX - rect.left) / rect.width) * 100);
    oy.set(((event.clientY - rect.top) / rect.height) * 100);
    zoom.set(zoomScale);
  }

  function handleLeave() {
    zoom.set(1);
    ox.set(50);
    oy.set(50);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        aria-label={`View ${alt} full size`}
        className={cn(
          "relative block w-full cursor-zoom-in overflow-hidden rounded-sheet bg-ash",
          className,
        )}
      >
        <motion.span
          layoutId={layoutId}
          /* Hidden while the lightbox is up: the layout animation lifts this
             very node out of the card, and leaving a copy behind would show a
             duplicate underneath the overlay. */
          style={{ transformOrigin: origin, scale, opacity: open ? 0 : 1 }}
          className="absolute inset-0 block"
        >
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
          {video && <PlateVideo src={video} onPhone={videoOnPhone} />}
        </motion.span>
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="lightbox"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={close}
                className="fixed inset-0 z-100 flex cursor-zoom-out items-center justify-center bg-ink/90 p-4 backdrop-blur-sm md:p-10"
              >
                <motion.figure
                  layoutId={layoutId}
                  onClick={(event) => event.stopPropagation()}
                  className={cn(
                    "relative cursor-default overflow-hidden rounded-sheet",
                    zoomClassName,
                  )}
                >
                  <Image src={src} alt={alt} fill sizes="90vw" className="object-cover" />
                </motion.figure>

                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.18 }}
                  className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 px-4 text-center font-mono text-[11px] tracking-[0.24em] text-bone/70 uppercase"
                >
                  {caption ?? alt}
                </motion.p>

                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="absolute top-5 right-5 grid size-11 place-items-center rounded-sheet border border-bone/25 text-bone transition-colors hover:bg-bone hover:text-ink md:top-8 md:right-8"
                >
                  <X className="size-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
