"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { MOTION_QUERY, REDUCED_QUERY, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The mark field — the ruled paper every surface is printed on.
 *
 * A matrix of graduations laid on the page's own measure, replacing the static
 * grid that used to sit here. Two things move it:
 *
 * - **A wave**, travelling slowly across the document on a diagonal. It is
 *   phrased in document coordinates rather than surface ones, so it crosses
 *   section joins as one wave instead of restarting at every edge.
 * - **The pointer.** Marks inside `REACH` lengthen, brighten and lean toward
 *   it. Nothing here follows the cursor as an object — the field simply reads
 *   higher near it, the way a needle does near what it is measuring.
 *
 * Written to be affordable on a page that carries ten of these:
 *
 * - One canvas per surface, one `fillRect` per mark, no DOM node per mark.
 * - Painted from GSAP's ticker, the same loop that drives every ScrollTrigger
 *   on the page, so it never runs two schedulers against one frame.
 * - Suspended *and freed* by IntersectionObserver. Stopping the paint is not
 *   enough at this count: a full-width backing store at DPR 2 is tens of
 *   megabytes, so a field that scrolls out of view drops its bitmap to 0×0
 *   and rebuilds on the way back in.
 * - One document-level pointer listener shared by every field on the page,
 *   rather than one listener each.
 *
 * The column rules behind the marks are CSS — see `rule-field` in
 * `app/globals.css`. They are the structure and they are there before this
 * component hydrates; the marks are what moves.
 */

/** How far the pointer reaches, in CSS px. */
const REACH = 220;

/** Above this response a mark is drawn in the brand's coral rather than ink. */
const HOT = 0.4;

/** Reused scratch for the coral pass: x, y, size, alpha, major. No allocation
    per frame, and the cap is far above the handful of marks that ever qualify. */
const hot = new Float64Array(320 * 5);

/** Viewport coordinates, parked off-screen until the pointer says otherwise. */
const pointer = { x: -9999, y: -9999 };
let watchers = 0;

const onPointerMove = (event: PointerEvent) => {
  /* Touch is ignored on purpose. A finger fires `pointermove` and then never
     leaves, so the field would be left holding a bright reading at the last
     place the page was tapped, with nothing there to explain it. */
  if (event.pointerType === "touch") return;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
};

const onPointerLeave = () => {
  pointer.x = -9999;
  pointer.y = -9999;
};

function watchPointer() {
  if (watchers++ === 0) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
  }

  return () => {
    if (--watchers === 0) {
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    }
  };
}

export function MarkField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useIsomorphicLayoutEffect(() => {
    const canvas = ref.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    /** A third of a layout column: the matrix reads the measure at three
        times its rate, which is dense enough to behave like a field rather
        than like scattered specks. */
    let pitch = 0;
    /** x of the centre mark, and the document y the first row sits on. */
    let originX = 0;
    let originY = 0;
    /** Row index of that first row, counted from the top of the document. */
    let originRow = 0;
    /** Distance from this surface's top edge to the document's. */
    let docTop = 0;
    /** The surface's own mark colour, and the one it registers a reading in. */
    let paint = "#141312";
    let accent = "#f2564a";

    const build = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return false;

      /* `--shell-*` are registered custom properties, so these come back as
         absolute numbers rather than as the literal `1.25rem` written in the
         stylesheet — the field lays its matrix on the layout's own measure
         instead of keeping a second copy of the breakpoints. */
      const root = getComputedStyle(document.documentElement);
      const max = parseFloat(root.getPropertyValue("--shell-max"));
      const pad = parseFloat(root.getPropertyValue("--shell-pad"));
      const cols = parseFloat(root.getPropertyValue("--shell-cols"));

      pitch = (Math.min(max, width) - 2 * pad) / cols / 3;
      if (!(pitch > 0)) return false;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Taken off the element, so a surface says what colour its own marks are
         with `text-ink` or `text-bone` and nothing has to be passed in. */
      paint = getComputedStyle(canvas).color;
      accent = root.getPropertyValue("--color-coral").trim() || accent;
      ctx.fillStyle = paint;

      /* Columns are measured out from the centre, which is what puts a mark on
         each edge of the text column — the same arithmetic the CSS rules use.
         The whole matrix is then pushed half a pitch off that, so the marks sit
         *between* the rules instead of on top of them: printed over each other
         the two readings just thickened the rules into a dashed mess, and
         neither one was legible as itself.

         Rows are measured from the top of the *document*, so the matrix runs
         through section joins rather than restarting at each one. */
      originX = width / 2 + pitch / 2;
      docTop = rect.top + window.scrollY;
      originRow = Math.ceil(docTop / pitch);
      originY = originRow * pitch - docTop;
      return true;
    };

    const draw = (time: number) => {
      if (!width || !height || !pitch) return;

      ctx.clearRect(0, 0, width, height);

      const rect = parent.getBoundingClientRect();
      const px = pointer.x - rect.left;
      const py = pointer.y - rect.top;

      const firstCol = Math.ceil(-originX / pitch);
      const lastCol = Math.floor((width - originX) / pitch);
      let count = 0;

      for (let i = firstCol; i <= lastCol; i++) {
        const x = originX + i * pitch;
        /* Every third column and row carries a graduation, the way a real
           scale marks its units: those are drawn as ticks, everything else as
           a point. */
        const wideCol = i % 3 === 0;
        const dx = x - px;

        for (let row = originRow, y = originY; y < height; row++, y += pitch) {
          const major = wideCol && row % 3 === 0;

          /* Phrased in document space so it is one wave across the page. */
          const wave = Math.sin(x * 0.0055 + (docTop + y) * 0.0045 - time * 0.5);

          const dy = y - py;
          const near = Math.max(0, 1 - Math.hypot(dx, dy) / REACH);
          /* Squared: a linear falloff spreads the response over the whole
             radius and the field reads as uniformly brighter rather than as
             having something under it. */
          const lift = near * near;

          const alpha = (major ? 0.11 : 0.07) * (0.55 + wave * 0.45) + 0.5 * lift;
          if (alpha <= 0.004) continue;

          /* A small lean toward the pointer. Enough to see the field turn
             when you move across it, not enough to read as a swarm. */
          const lean = 5 * lift;
          const mx = x - (dx / REACH) * lean;
          const my = y - (dy / REACH) * lean;
          const size = major ? 6 + 12 * lift : 1.5 + 2.6 * lift;

          /* The few marks directly under the pointer are held back for the
             coral pass. One colour change per frame instead of one per mark:
             the whole point of a single `fillStyle` is not to give it up. */
          if (lift > HOT && count < hot.length) {
            hot[count] = mx;
            hot[count + 1] = my;
            hot[count + 2] = size;
            hot[count + 3] = alpha;
            hot[count + 4] = major ? 1 : 0;
            count += 5;
            continue;
          }

          ctx.globalAlpha = alpha;
          if (major) ctx.fillRect(mx, my - size / 2, 1, size);
          else ctx.fillRect(mx - size / 2, my - size / 2, size, size);
        }
      }

      /* The instrument registering what is nearest it, in the one colour this
         site raises its voice in. Kept to the innermost third of the reach so
         it reads as a reading rather than as a glow following the cursor. */
      if (count) {
        ctx.fillStyle = accent;
        for (let i = 0; i < count; i += 5) {
          const size = hot[i + 2];
          ctx.globalAlpha = hot[i + 3];
          if (hot[i + 4]) ctx.fillRect(hot[i], hot[i + 1] - size / 2, 1, size);
          else ctx.fillRect(hot[i] - size / 2, hot[i + 1] - size / 2, size, size);
        }
        ctx.fillStyle = paint;
      }

      ctx.globalAlpha = 1;
    };

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY, () => {
      const untrack = watchPointer();

      let running = false;

      const start = () => {
        if (running) return;
        if (!build()) return;
        running = true;
        /* One paint up front so the field is there in the frame it enters,
           rather than a tick later. */
        draw(gsap.ticker.time);
        gsap.ticker.add(draw);
      };

      const stop = () => {
        if (!running) return;
        running = false;
        gsap.ticker.remove(draw);
        /* Hand the backing store back. Ten surfaces holding a full-width
           bitmap each is the difference between a few megabytes and a few
           hundred. */
        canvas.width = 0;
        canvas.height = 0;
        width = 0;
        height = 0;
      };

      const observer = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { rootMargin: "160px" },
      );
      observer.observe(parent);

      const resize = new ResizeObserver(() => {
        if (running) build();
      });
      resize.observe(parent);

      return () => {
        stop();
        untrack();
        observer.disconnect();
        resize.disconnect();
      };
    });

    /* Reduced motion keeps the field and holds it still: it is texture, and
       removing it would change the composition rather than calm it. */
    mm.add(REDUCED_QUERY, () => {
      const paint = () => {
        if (build()) draw(0);
      };
      paint();
      const resize = new ResizeObserver(paint);
      resize.observe(parent);
      return () => resize.disconnect();
    });

    return () => mm.revert();
  }, []);

  return <canvas ref={ref} aria-hidden className={cn("rule-field", className)} />;
}
