"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { MOTION_QUERY, useIsomorphicLayoutEffect } from "@/lib/motion";
import { METRICS } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The metrics tape.
 *
 * A strip of the readings this agency is actually judged on, running edge to
 * edge between sections. It is the one loud element on the page, and it earns
 * the volume by being the brand's own vocabulary rather than ornament.
 *
 * The track is rendered twice and translated by exactly -50%, which is what
 * makes the loop seamless; `aria-hidden` on the duplicate keeps screen
 * readers from hearing the list twice.
 *
 * It also reads the scroll. Scrolling down speeds the tape up in its own
 * direction; scrolling up drags it back the other way; letting go settles it
 * to its idle speed. The tape stops being a decorative loop and becomes the
 * one element on the page that tells you how fast you are moving through it.
 *
 * The idle loop is a CSS animation in the markup, so it runs before hydration
 * and without JavaScript at all. GSAP takes the class off and picks the tween
 * up from the same zero position, so the handover is invisible.
 */

/** Seconds for one full pass. The reverse tape runs slower, for contrast. */
const CYCLE = { normal: 38, reverse: 46 };

export function Tape({
  tone = "coral",
  reverse = false,
  className,
}: {
  tone?: "coral" | "gold" | "ink";
  reverse?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY, () => {
      /* Hand over from the CSS keyframes. Both start at translate 0, so
         there is nothing to reconcile. */
      track.classList.remove("tape-track", "tape-track-reverse");

      /* Direction of travel is baked into the tween's endpoints rather than
         into a negative timeScale. A tween sitting at time 0 has nowhere to
         go backwards to, so a reverse tape started that way stalls on its
         first frame; this way both tapes always play forwards and the sign of
         `timeScale` is left free to mean one thing only — which way the
         visitor is scrolling. */
      const loop = reverse
        ? gsap.fromTo(
            track,
            { xPercent: -50 },
            { xPercent: 0, ease: "none", duration: CYCLE.reverse, repeat: -1 },
          )
        : gsap.to(track, { xPercent: -50, ease: "none", duration: CYCLE.normal, repeat: -1 });

      /* `quickTo` writes straight to the tween's timeScale without building a
         new tween per scroll event — this fires on every frame of a scroll. */
      const scrub = gsap.quickTo(loop, "timeScale", { duration: 0.45, ease: "power2.out" });
      const settle = gsap.delayedCall(0.35, () => scrub(1)).pause();

      const trigger = ScrollTrigger.create({
        onUpdate: (self) => {
          /* Velocity is px/s and routinely runs into the thousands, so it is
             compressed hard and capped: the tape should react, not bolt. */
          const boost = Math.min(Math.abs(self.getVelocity()) / 900, 3);
          scrub(self.direction * (1 + boost));
          settle.restart(true);
        },
      });

      return () => {
        settle.kill();
        trigger.kill();
        loop.kill();
      };
    });

    return () => mm.revert();
  }, [reverse]);

  const surface = {
    coral: "bg-coral text-bone",
    gold: "bg-gold text-ink",
    ink: "bg-ink text-bone",
  }[tone];

  const list = (hidden: boolean) => (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-10 pr-10 md:gap-14 md:pr-14"
    >
      {METRICS.map((metric) => (
        <li
          key={metric}
          className="flex shrink-0 items-center gap-10 font-mono text-xs uppercase tracking-[0.2em] tabular md:gap-14 md:text-sm"
        >
          {metric}
          <span aria-hidden className="text-base leading-none opacity-50">
            #
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={cn("relative overflow-hidden py-3.5 md:py-4", surface, className)}>
      <div
        ref={trackRef}
        className={cn("flex w-max tape-track", reverse && "tape-track-reverse")}
      >
        {list(false)}
        {list(true)}
      </div>
    </div>
  );
}
