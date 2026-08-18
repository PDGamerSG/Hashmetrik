"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MOTION_QUERY, REDUCED_QUERY, useIsomorphicLayoutEffect } from "@/lib/motion";

/**
 * The hero's background: a field of measurement marks, drifting.
 *
 * Every other decorative surface on this site is a scale of some kind — the
 * tick rule, the mark field, the metrics tape — so the hero's background is
 * the same idea unmoored: these marks have come loose from the field behind
 * them and are floating. A particle field would have been decoration; this is the brand's
 * own vocabulary, moving.
 *
 * It is written to be cheap enough to leave running:
 *
 * - One canvas, one 2D context, no DOM nodes per mark.
 * - Painted from GSAP's ticker, the same loop that drives every ScrollTrigger
 *   on the page, so there are never two animation loops competing for the
 *   same frame.
 * - Suspended by IntersectionObserver the moment the hero leaves the
 *   viewport. The rest of the page is long, and there is no reason to keep
 *   compositing a background nobody can see.
 * - Device pixel ratio capped at 2. Above that the mark count has to fall to
 *   pay for the fill rate, which costs more than the sharpness is worth on a
 *   field of 3px dots.
 */

type Mark = {
  x: number;
  y: number;
  /** 0 = far, 1 = near. Sets size, opacity and parallax response together. */
  depth: number;
  vx: number;
  vy: number;
  /** Long tick or dot — the same two weights the tick rule uses. */
  long: boolean;
  phase: number;
};

const DENSITY = 1 / 19000; /* marks per CSS px² */
const MAX_MARKS = 90;

export function HeroField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useIsomorphicLayoutEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let marks: Mark[] = [];
    let width = 0;
    let height = 0;
    /* Pointer parallax, in CSS px, already smoothed towards its target. */
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;

    const build = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(MAX_MARKS, Math.round(width * height * DENSITY));
      marks = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          depth,
          /* Near marks drift faster, which is what sells the depth — sizes
             alone read as randomness rather than as distance. */
          vx: (Math.random() - 0.5) * (0.08 + depth * 0.16),
          vy: (Math.random() - 0.5) * (0.06 + depth * 0.12),
          long: Math.random() < 0.22,
          phase: Math.random() * Math.PI * 2,
        };
      });
    };

    const draw = (time: number) => {
      if (!width || !height) return;

      /* Ease the parallax rather than following the pointer exactly: the
         field is meant to feel heavy, and a 1:1 response makes it twitch. */
      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#0e0e0f";

      for (const mark of marks) {
        mark.x += mark.vx;
        mark.y += mark.vy;

        /* Wrap rather than bounce. A bounce puts every mark on the same
           boundary eventually and the field visibly frames itself. */
        if (mark.x < -8) mark.x = width + 8;
        else if (mark.x > width + 8) mark.x = -8;
        if (mark.y < -8) mark.y = height + 8;
        else if (mark.y > height + 8) mark.y = -8;

        const x = mark.x + px * mark.depth;
        const y = mark.y + py * mark.depth;

        /* A slow individual breath, so the field never looks like a still
           image being panned. */
        const breath = 0.72 + Math.sin(time * 0.6 + mark.phase) * 0.28;
        ctx.globalAlpha = (0.05 + mark.depth * 0.16) * breath;

        if (mark.long) {
          ctx.fillRect(x, y, 1, 5 + mark.depth * 7);
        } else {
          const r = 0.9 + mark.depth * 1.4;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    };

    const onPointer = (event: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      tx = ((event.clientX - rect.left) / rect.width - 0.5) * -34;
      ty = ((event.clientY - rect.top) / rect.height - 0.5) * -22;
    };

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY, () => {
      build();
      /* One paint up front, so the field is present in the very first frame
         rather than fading in a beat after the headline. */
      draw(0);

      let running = false;
      const start = () => {
        if (running) return;
        running = true;
        gsap.ticker.add(draw);
      };
      const stop = () => {
        if (!running) return;
        running = false;
        gsap.ticker.remove(draw);
      };

      const observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      observer.observe(parent);

      const resize = new ResizeObserver(build);
      resize.observe(parent);

      parent.addEventListener("pointermove", onPointer);

      return () => {
        stop();
        observer.disconnect();
        resize.disconnect();
        parent.removeEventListener("pointermove", onPointer);
        ctx.clearRect(0, 0, width, height);
      };
    });

    /* Reduced motion still gets the field, just held still: it is texture,
       and removing it would change the composition rather than calm it. */
    mm.add(REDUCED_QUERY, () => {
      build();
      draw(0);
      const resize = new ResizeObserver(() => {
        build();
        draw(0);
      });
      resize.observe(parent);
      return () => resize.disconnect();
    });

    return () => mm.revert();
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
