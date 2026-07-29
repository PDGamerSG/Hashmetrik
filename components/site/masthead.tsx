"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SOCIALS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { setScrollLocked } from "@/components/motion/smooth-scroll";
import { Magnetic } from "@/components/motion/magnetic";
import { ActionLink } from "./button";
import { SectionLink } from "./section-link";

export function Masthead() {
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lifted, setLifted] = useState(false);

  /**
   * Two readings off one scroll listener.
   *
   * `progress` scales the hairline under the bar — the same measuring idea as
   * the tick rule, at the scale of the whole document. `lifted` is the
   * threshold at which the bar contracts: it opens at full height so the
   * wordmark lands properly, then gives its extra height back to the content
   * as soon as there is content to give it to.
   *
   * Both are compared before being written, because this fires on every
   * frame of a Lenis scroll and a `setState` per frame would re-render the
   * nav sixty times a second for a value that changes twice.
   */
  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
      setLifted((was) => {
        const now = window.scrollY > 24;
        return now === was ? was : now;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* A menu that covers the page must not leave the page scrolling behind it —
     and under Lenis the scroller has to be stopped as well as the body. */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    setScrollLocked(open);
    return () => {
      document.body.style.overflow = "";
      setScrollLocked(false);
    };
  }, [open]);

  return (
    <header
      /* Named so the page transition can hold it still while the routes
         beneath it crossfade — see `::view-transition-group(masthead)`. */
      style={{ viewTransitionName: "masthead" }}
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        lifted ? "border-ash bg-bone/80 backdrop-blur-md" : "border-transparent bg-bone",
      )}
    >
      <div
        className={cn(
          "shell flex items-center justify-between gap-4",
          /* The shrink. Height and the mark's scale are the only things that
             move; the wordmark keeps its size, because a headline that
             changes size as you scroll is a distraction rather than a
             response. */
          "transition-[height] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
          lifted ? "h-14 md:h-16" : "h-16 md:h-20",
        )}
      >
        {/* The mark is a dark tile, so it is sized against the cap height of
            the wordmark rather than the height of the bar — at the old size
            it read as a black block with a caption next to it. */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/logo-hm.png"
            alt=""
            width={64}
            height={64}
            className={cn(
              "rounded-sheet object-cover transition-[width,height] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
              lifted ? "size-6 md:size-7" : "size-7 md:size-8",
            )}
            priority
          />
          <span className="font-display text-xl leading-none font-semibold tracking-[-0.04em] md:text-[1.375rem]">
            HashMetrik
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <SectionLink
              key={item.label}
              href={item.href}
              /* The rule wipes in from the left on hover and out to the right
                 on release, so the gesture has a direction rather than just
                 appearing and vanishing. */
              className="group relative py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-slate transition-colors hover:text-ink"
            >
              {item.label}
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-0.5 h-px origin-right scale-x-0 bg-coral transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
              />
            </SectionLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Kept at every width — the phone is where most of this traffic
              lands, and hiding the only conversion behind a hamburger costs
              more than the few pixels it saves. */}
          <Magnetic strength={5}>
            <ActionLink href="/book" className="h-11 px-4 sm:px-6">
              <span className="sm:hidden">Book</span>
              <span className="hidden sm:inline">Book a call</span>
            </ActionLink>
          </Magnetic>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            className="grid size-11 place-items-center rounded-sheet border border-ash text-ink transition-colors hover:border-ink lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Reading of scroll position. Scales from the left, like a gauge. */}
      <div
        aria-hidden
        className="h-px origin-left bg-coral transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />

      {open && (
        <div
          id="site-menu"
          /* The page behind is frozen while this is open, which also means
             Lenis is stopped and swallowing wheel events. `data-lenis-prevent`
             excludes the menu, so a long nav still scrolls on a short screen. */
          data-lenis-prevent
          /* Starts exactly under the bar, which is two heights depending on
             whether the page has been scrolled. */
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-ash bg-bone lg:hidden",
            lifted ? "top-14 md:top-16" : "top-16 md:top-20",
          )}
        >
          <nav aria-label="Mobile" className="shell flex flex-col py-8">
            {NAV.map((item, i) => (
              <SectionLink
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-ash py-5 font-display text-3xl font-semibold tracking-[-0.03em]"
              >
                <span className="font-mono text-[11px] tracking-[0.22em] tabular text-slate">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </SectionLink>
            ))}

            <ActionLink href="/book" className="mt-8 h-14" onClick={() => setOpen(false)}>
              Book a free consultation
            </ActionLink>

            {/* Set as rows with their own height rather than as a line of
                text: this list only ever appears on a phone, where the target
                is a thumb. */}
            <ul className="mt-6 flex flex-wrap gap-x-6">
              {SOCIALS.map((s) => (
                <li key={s.code}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.22em] text-slate transition-colors hover:text-coral"
                  >
                    {s.code} · {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
