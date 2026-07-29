"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The light in the room.
 *
 * Two blooms over the hero, under the grain, and nothing else. Both are
 * gradients rather than images, so the whole effect costs one composited layer
 * and no bytes.
 *
 * - **The sweep** arrives as the opening sheet lifts: a broad warm light
 *   entering from the top-left, easing to rest and then drifting for as long
 *   as the page is open. It is written in CSS, timed off `--intro-duration`
 *   like everything else in the opening, so it runs whether or not the bundle
 *   ever lands.
 * - **The cursor bloom** follows the pointer at a distance, on the same
 *   `quickTo` treatment as the plates.
 *
 * Both are lifted from the site's own art direction rather than from the
 * lightbox aesthetic they resemble: every photograph on this page is specified
 * as *natural window light, raking across paper*. This is that light, on the
 * page itself. Which is also why it is warm and extremely faint — the palette
 * is matte printed matter, and a glow that reads as glass would undo the whole
 * system. Anything that announces itself here is too strong.
 */
export function HeroLight() {
  const cursor = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = cursor.current;
    const hero = el?.parentElement?.parentElement;
    if (!el || !hero) return;

    const mm = gsap.matchMedia();

    /* Pointer only. A bloom that cannot be moved is a smudge on the screen,
       so on touch there is simply the sweep. */
    mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      const x = gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" });
      const y = gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" });
      const fade = gsap.quickTo(el, "opacity", { duration: 0.6, ease: "power2.out" });

      /* Placed before it is revealed, or the first move drags the bloom in
         from the corner it was parked in. */
      const onEnter = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        gsap.set(el, { x: event.clientX - rect.left, y: event.clientY - rect.top });
        fade(1);
      };

      const onMove = (event: PointerEvent) => {
        const rect = hero.getBoundingClientRect();
        x(event.clientX - rect.left);
        y(event.clientY - rect.top);
      };

      hero.addEventListener("pointerenter", onEnter);
      hero.addEventListener("pointermove", onMove);
      hero.addEventListener("pointerleave", () => fade(0));

      return () => {
        hero.removeEventListener("pointerenter", onEnter);
        hero.removeEventListener("pointermove", onMove);
        gsap.set(el, { opacity: 0 });
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Two elements for one light: the outer runs the entrance, the inner
          the endless drift. One element cannot do both — they are the same
          `transform`, and the second declaration would simply win. */}
      <div className="hero-sweep absolute inset-0">
        <div className="hero-sweep-drift absolute inset-[-15%]" />
      </div>

      {/* Parked at the origin and offset by half its own size in CSS, so GSAP
          can write raw pointer coordinates into `x`/`y` without having to
          compose a `-50%` translate on every frame. */}
      <div ref={cursor} className="hero-bloom absolute top-0 left-0 opacity-0" />
    </div>
  );
}
