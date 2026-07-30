"use client";

import { useEffect, useRef, useState } from "react";
import { useIsMounted, usePageLoaded, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The moving frame of a plate.
 *
 * Every photograph on this page that has a clip behind it keeps the photograph:
 * this layer sits *over* a still that is already in the markup, so the server
 * render, the first screen of a cold load, and anyone who has asked for less
 * motion all get a finished composition and nothing here is load bearing. What
 * the clip adds is the one thing a still cannot — evidence that the room is
 * real.
 *
 * It is deliberately expensive to trigger:
 *
 * - The `src` is attached by the IntersectionObserver, not by the markup, so a
 *   clip four sections down the page is never fetched by a visitor who does not
 *   reach it.
 * - Playback pauses the moment the plate leaves the viewport. The page is long
 *   and there is no reason to keep four decoders alive behind it.
 * - On a phone it plays only where `onPhone` says so, and only once the page
 *   has finished loading — see the prop and the gate below.
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
   * The blanket rule used to be "no video on a handset", and it was most of
   * the reason the site read as a set of still photographs on a phone. What
   * the rule was actually protecting against is several decoders alive at
   * once, which is a property of the layout rather than of the screen — so it
   * is the layout that opts in, one caller at a time.
   *
   * The pillar panels are a single column below `md`, so the observer below
   * has stopped one clip before the next one starts: one decoder. The hero
   * renders two of its four plates on a phone — the other two are `hidden
   * md:block` and, being `display: none`, never intersect and never fetch — so
   * it costs two, both of them small. That is worth paying for, and the gate
   * below is what keeps it from being paid at the wrong moment.
   */
  onPhone?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playable, setPlayable] = useState(false);
  const [wide, setWide] = useState(false);
  const mounted = useIsMounted();
  const loaded = usePageLoaded();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /**
   * On a phone, nothing starts until the page itself has finished loading.
   *
   * A wide screen can start a clip the moment the observer says so: the plates
   * that matter there are either already past the fold or 300px short of it,
   * and the connection is rarely the bottleneck. A phone is the opposite case
   * — the hero's clips are *inside* the first screen, so fetching them on
   * sight puts a megabyte of video in front of the still that is actually
   * holding the composition together.
   *
   * The cost of waiting is a second or so of stillness at the top of the page,
   * which is the same second the visitor spends reading the headline. Nothing
   * here is load bearing and the poster underneath is the finished frame
   * either way, so it is a second that costs nothing to give up.
   */
  const eligible = mounted && (wide || (onPhone && loaded)) && !reduced;

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
