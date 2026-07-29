"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
import { MOTION_QUERY, useIsomorphicLayoutEffect } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Overslide — panels that stack rather than scroll past.
 *
 * Each panel pins itself to the top of the viewport and the next one rides up
 * over it, like sheets being laid on a desk. Because the panel underneath is
 * still there, the sequence reads as one accumulating idea rather than as six
 * unrelated screens, which is exactly what a set of pillars in a single
 * package should feel like.
 *
 * The pinning is `position: sticky`, not a JS pin. That means it costs nothing
 * on the main thread, survives a failed bundle, and never leaves the page in a
 * broken pinned state if a resize lands mid-scroll. JavaScript is only added
 * for the part CSS cannot do: dimming and shrinking the covered panel so it
 * recedes instead of simply being hidden.
 *
 * Below `md` the whole mechanism is off. A stack of viewport-height panels on
 * a phone is a scroll-jail — you cannot see how long it is or get out of it
 * quickly — so there the panels are ordinary sections in a column.
 */

export function Overslide({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const mm = gsap.matchMedia();

    mm.add(
      { motion: MOTION_QUERY, stacked: "(min-width: 768px)" },
      (context) => {
        if (!context.conditions?.motion || !context.conditions?.stacked) return;

        const veils = gsap.utils.toArray<HTMLElement>("[data-overslide-veil]", root);
        const inners = gsap.utils.toArray<HTMLElement>("[data-overslide-inner]", root);
        const covered = veils.length - 1;
        if (covered < 1) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            /* A touch of scrub smoothing: the veil is the only thing on screen
               that changes with scroll here, and a hard 1:1 mapping makes the
               dimming look like it is stepping rather than fading. */
            scrub: 0.5,
          },
        });

        veils.forEach((veil, i) => {
          if (i >= covered) return;
          /* Placed at `i` on a timeline whose tweens are one unit long, so
             each panel dims across exactly the scroll that covers it. */
          tl.to(veil, { opacity: 0.7, ease: "none", duration: 1 }, i)
            .to(inners[i], { scale: 0.94, ease: "none", duration: 1 }, i);
        });
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {children}
    </div>
  );
}

export function OverslidePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    /* `isolate` gives each panel its own stacking context so the veil can sit
       above its own content without reaching the panel laid on top of it. */
    <section
      className={cn(
        "relative isolate overflow-hidden md:sticky md:top-0 md:flex md:h-dvh md:items-center",
        className,
      )}
    >
      <div data-overslide-inner className="w-full origin-top">
        {children}
      </div>

      <div
        data-overslide-veil
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30 hidden bg-ink opacity-0 md:block"
      />
    </section>
  );
}
