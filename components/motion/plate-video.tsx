"use client";

import { useEffect, useRef, useState } from "react";
import { useIsMounted, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The moving frame of a plate.
 *
 * Every photograph on this page that has a clip behind it keeps the photograph:
 * this layer sits *over* a still that is already in the markup, so the server
 * render, the phone, and anyone who has asked for less motion all get a
 * finished composition and nothing here is load bearing. What the clip adds is
 * the one thing a still cannot — evidence that the room is real.
 *
 * It is deliberately expensive to trigger:
 *
 * - The `src` is attached by the IntersectionObserver, not by the markup, so a
 *   clip four sections down the page is never fetched by a visitor who does not
 *   reach it.
 * - Playback pauses the moment the plate leaves the viewport. The page is long
 *   and there is no reason to keep four decoders alive behind it.
 * - On a phone it plays only where `onPhone` says so — see the prop below.
 *
 * The poster is derived from the clip's path rather than passed: both come out
 * of the same encode, where the poster is the clip's own first frame. That is
 * what makes the cross-fade land on the frame playback actually starts on
 * instead of a different moment in the take.
 */
export function PlateVideo({
  src,
  poster = src.replace(/\.mp4$/, "-poster.webp"),
  className,
  onPhone = false,
}: {
  src: string;
  poster?: string;
  className?: string;
  /**
   * Whether this clip may play below `md`.
   *
   * The blanket rule used to be "no video on a handset", which was the right
   * call for the hero — three plates share that screen and three simultaneous
   * decodes is not a trade an opening should make. It was the wrong call
   * everywhere else, and it was most of the reason the site read as a set of
   * still photographs on a phone.
   *
   * Where the layout guarantees one clip on screen at a time — the pillar
   * panels, which are a single column below `md` — the cost is one decoder,
   * and the observer below has already stopped it before the next one starts.
   * That is worth paying for; three at once is not.
   */
  onPhone?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playable, setPlayable] = useState(false);
  const [wide, setWide] = useState(false);
  const mounted = useIsMounted();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const eligible = mounted && (wide || onPhone) && !reduced;

  useEffect(() => {
    const el = ref.current;
    if (!eligible || !el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          el.pause();
          return;
        }
        /* Assigned once. Re-assigning on every re-entry would restart the
           download and drop the visitor back to the poster each time. */
        if (!el.src) el.src = src;
        /* Autoplay is refused often enough — a battery-saver tab, a strict
           setting — that the rejection has to be swallowed rather than thrown.
           The still underneath is already the fallback. */
        void el.play().catch(() => {});
      },
      /* On a wide screen, started a little before the plate arrives so the
         fade has run by the time it is properly on screen rather than in
         front of the visitor.

         No margin at all on a phone, which is what actually holds this
         component to one decoder there. Stacked in a column the pillar panels
         sit about 850px apart against a 664px viewport, so any pre-roll over
         ~90px puts two plates inside the root at once and they start together
         — measured, and the pair of simultaneous decodes is the exact cost
         `onPhone` promises not to pay. It also means a second clip is never
         pulled over mobile data for a panel the visitor may never reach. The
         trade is that the cross-fade begins as the plate touches the edge of
         the screen instead of just before it, which at a 1s fade is not
         something you can catch. */
      { rootMargin: wide ? "300px 0px" : "0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [eligible, wide, src]);

  if (!eligible) return null;

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      /* Decoration over a still that already carries the meaning, and the
         still's `alt` is the one description of it either way. */
      aria-hidden
      tabIndex={-1}
      onCanPlay={() => setPlayable(true)}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
        playable ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}
