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

  /* A menu that covers the page must not leave the page scrolling behind it.
     `setScrollLocked` is the whole lock — the scroller and the CSS both. It
     deliberately does not touch `<body>`; see the note there for why writing
     the lock onto the body is what used to shunt this very bar off-screen. */
  useEffect(() => {
    setScrollLocked(open);
    return () => setScrollLocked(false);
  }, [open]);

  return (
    <>
      <header
        /* Named so the page transition can hold it still while the routes
           beneath it crossfade — see `::view-transition-group(masthead)`. */
        style={{ viewTransitionName: "masthead" }}
        /* Above the open menu, which is in turn above the assistant launcher —
           the bar holds the only control that closes the menu, so nothing may
           ever cover it. */
        className={cn(
          "sticky top-0 z-60 border-b transition-colors duration-300",
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
            <span className="font-display text-xl leading-[1.02] font-medium tracking-[-0.022em] md:text-[1.375rem]">
              HashMetrik
            </span>
          </Link>

          {/* `gap-6` until there is room for more: the sixth entry and the
              sign-in link together overrun the bar at exactly 1024px. */}
          <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV.map((item) => (
              <SectionLink
                key={item.label}
                href={item.href}
                /* The rule wipes in from the left on hover and out to the right
                   on release, so the gesture has a direction rather than just
                   appearing and vanishing. */
                className="group relative py-1 label text-slate transition-colors hover:text-ink"
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
            {/* The way in to the client and team areas, which nothing on the
                marketing site linked to before.

                Deliberately a fixed link rather than one that reads the session:
                this layout is statically rendered, and reaching for the cookie
                here would make every marketing page dynamic to change one word.
                It costs nothing to be wrong, either — `proxy.ts` bounces anyone
                who already has a session off `/login` and on to their own home,
                so a signed-in visitor who presses this lands exactly where a
                live check would have sent them.

                Held back until `md`: on a phone this would sit between the
                wordmark and the only conversion on the page, and the menu
                carries it instead. */}
            <Link
              href="/login"
              className="hidden label text-slate transition-colors hover:text-ink md:inline-block"
            >
              Sign in
            </Link>

            {/* Kept at every width — the phone is where most of this traffic
                lands, and hiding the only conversion behind a hamburger costs
                more than the few pixels it saves. */}
            <Magnetic strength={5}>
              <ActionLink href="/book" size="sm">
                <span className="sm:hidden">Book</span>
                <span className="hidden sm:inline">Book a call</span>
              </ActionLink>
            </Magnetic>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              /* `size-10` rather than 11: it stands next to the `sm` action
                 pill, which is `h-10`, and a toggle a notch taller than the
                 button beside it reads as a misalignment rather than as
                 emphasis. */
              className="grid size-10 place-items-center rounded-full border border-ink/25 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone active:bg-ink active:text-bone lg:hidden"
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
      </header>

      {/* Deliberately a sibling of the bar, not a child of it.
          `position: fixed` resolves against the nearest ancestor carrying a
          filter, transform or containment — and past 24px of scroll the bar
          takes `backdrop-blur-md`, which is a `backdrop-filter` and so becomes
          exactly that ancestor. Nested, this panel measured `top-14 bottom-0`
          against the 56px bar instead of the viewport and collapsed to a 1px
          sliver at a negative offset: open, painted, and untouchable. Out here
          nothing above it can capture it. */}
      {open && (
        <div
          id="site-menu"
          /* The page behind is frozen while this is open, which also means
             Lenis is stopped and swallowing wheel events. `data-lenis-prevent`
             excludes the menu, so a long nav still scrolls on a short screen. */
          data-lenis-prevent
          /* Starts exactly under the bar, which is two heights depending on
             whether the page has been scrolled. Above the assistant launcher's
             `z-50`: a chat bubble floating on top of an open menu is a second
             thing to dismiss, in the corner where the thumb already is. */
          className={cn(
            "fixed inset-x-0 bottom-0 z-55 flex flex-col overflow-y-auto overscroll-contain border-t border-ash bg-bone lg:hidden",
            lifted ? "top-14 md:top-16" : "top-16 md:top-20",
          )}
        >
          {/* The bottom padding clears the assistant launcher and, under it,
              the home indicator. Without it the last row of the menu sits
              beneath both and cannot be read or pressed. */}
          <nav
            aria-label="Mobile"
            className="shell flex flex-1 flex-col pt-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
          >
            {/* The rules belong to the list, not to each row: hung off the rows
                themselves the last one trailed under "Contact" with nothing
                beneath it to separate. */}
            <ul className="divide-y divide-ash border-y border-ash">
              {NAV.map((item, i) => (
                <li key={item.label}>
                  <SectionLink
                    href={item.href}
                    onClick={() => setOpen(false)}
                    /* Set at the size of a heading in running text rather than
                        of a page title. Six entries at display size is a menu
                        that has to be scrolled to be read, and the answer to
                        "where can I go" should fit on the screen at once. */
                    className="flex items-center gap-4 py-3.5 font-display text-[1.375rem] leading-[1.2] font-medium tracking-[-0.018em] transition-colors active:text-coral"
                  >
                    {/* A fixed column, so the words start on one edge rather
                        than each one where its own number happened to end. */}
                    <span className="w-5 shrink-0 label-sm tabular text-slate">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>

            {/* `md`, not `lg`. The bar above already carries a Book pill; a
                full-bleed slab at display height repeats it as the loudest
                object on the screen. */}
            <ActionLink href="/book" size="md" className="mt-7" onClick={() => setOpen(false)}>
              Book a free consultation
            </ActionLink>

            {/* The phone's copy of the sign-in link held back in the bar. */}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex min-h-11 items-center label text-slate transition-colors hover:text-ink active:text-ink"
            >
              Sign in to your account
            </Link>

            {/* Pushed to the foot of the panel where there is room for it, and
                simply following the sign-in link where there is not. Set as
                rows with their own height rather than as a line of text: this
                list only ever appears on a phone, where the target is a
                thumb. */}
            <ul className="mt-auto flex flex-wrap gap-x-5 pt-6">
              {SOCIALS.map((s) => (
                <li key={s.code}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center label-sm text-slate transition-colors hover:text-coral active:text-coral"
                  >
                    {s.code} · {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
