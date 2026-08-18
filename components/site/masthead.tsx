"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV, SOCIALS } from "@/lib/content";
import { cn } from "@/lib/utils";
import { setScrollLocked } from "@/components/motion/motion-root";
import { Magnetic } from "@/components/motion/magnetic";
import { ActionLink } from "./button";
import { Facebook, Instagram, Linkedin, Youtube } from "./brand-icons";
import { SectionLink } from "./section-link";

/**
 * The glyph for each network, keyed by the code `SOCIALS` already carries.
 *
 * The footer prints those codes as text, which is right in a column of links
 * that is read. Here there is one row and no column to read it against, so
 * four codes set in mono wrapped onto a second line and left `FB · FACEBOOK`
 * stranded under the rest. Marks are recognised rather than read, fit on one
 * line, and give the thumb a target the size of a thumb.
 */
const SOCIAL_ICON = {
  IG: Instagram,
  LI: Linkedin,
  YT: Youtube,
  FB: Facebook,
} as const;

export function Masthead() {
  const pathname = usePathname();
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
   * scroll frame and a `setState` per frame would re-render the nav sixty
   * times a second for a value that changes twice.
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

  /**
   * Whether a nav entry is the page being read.
   *
   * Only the two entries that are pages of their own can be. The rest are
   * sections of the home page, and where the reader is inside a page is
   * answered by the scroll position rather than by the address bar — which is
   * the whole point of `SectionLink` keeping the fragment out of it.
   */
  const isCurrent = (href: string) => !href.includes("#") && pathname.startsWith(href);

  /* A menu that covers the page must not leave the page scrolling behind it.
     `setScrollLocked` deliberately does not touch `<body>`; see the note there
     for why writing the lock onto the body is what used to shunt this very bar
     off-screen. */
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
            <span className="font-display text-[1.375rem] leading-[1.02] font-medium tracking-[-0.022em] md:text-[1.625rem]">
              Hashmetrik
            </span>
          </Link>

          {/* Set in sentence case, the six entries take about a hundred pixels
              less than they did as tracked capitals, and the gaps are spent on
              that: `gap-7` is the tightest these words separate cleanly, and
              `gap-9` is what the bar can afford once it is wider than the
              content. Still `lg`, because below it the sign-in link and the
              sixth entry together overrun. */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-9">
            {NAV.map((item) => {
              const current = isCurrent(item.href);

              return (
                <SectionLink
                  key={item.label}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  /* Ink at 85%, not `slate`. Slate is the colour of secondary
                     text — a caption, a note under a figure — and at this size
                     it left six links looking greyed out beside a black
                     wordmark. These are the primary controls on the page; they
                     are ink, stepped back just far enough that the wordmark
                     still leads. 11:1 on paper. */
                  className={cn(
                    "group relative py-1.5 nav-link transition-colors duration-300 ease-[var(--ease-out-quint)] xl:text-[1.0625rem]",
                    current ? "text-ink" : "text-ink/85 hover:text-ink",
                  )}
                >
                  {item.label}
                  {/* The rule wipes in from the left on hover and out to the
                      right on release, so the gesture has a direction rather
                      than just appearing and vanishing. On the page you are
                      already on it is simply drawn, and stays. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 bottom-0 h-px bg-coral transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      current
                        ? "origin-left scale-x-100"
                        : "origin-right scale-x-0 group-hover:origin-left group-hover:scale-x-100",
                    )}
                  />
                </SectionLink>
              );
            })}
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
              /* The nav's recipe, not the label's: this is the seventh link in
                 the row, and it was the one place where the bar spoke in two
                 voices at once — mono capitals hard against a sentence-case
                 sans pill. */
              className="hidden nav-link text-ink/85 transition-colors duration-300 ease-[var(--ease-out-quint)] hover:text-ink md:inline-block xl:text-[1.0625rem]"
            >
              Sign in
            </Link>

            {/* Kept at every width — the phone is where most of this traffic
                lands, and hiding the only conversion behind a hamburger costs
                more than the few pixels it saves. */}
            <Magnetic strength={5}>
              {/* Set at the nav's size rather than the `sm` pill's own 13px:
                  the links beside it read at 15, and the one thing on the bar
                  a visitor is meant to press should not be the smallest type
                  on it. The height goes up with the type — an `h-10` cap round
                  a 15px label leaves four pixels of air over the ascenders. */}
              <ActionLink href="/book" size="sm" className="h-11 text-[1rem]">
                <span className="sm:hidden">Book</span>
                <span className="hidden sm:inline">Book a call</span>
              </ActionLink>
            </Magnetic>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-menu"
              /* Sized off the action pill beside it, whatever that is — a
                 toggle a notch taller or shorter than the button next to it
                 reads as a misalignment rather than as emphasis. The pill is
                 `h-11` here, so this is `size-11`. */
              className="grid size-11 place-items-center rounded-full border border-ink/25 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-bone active:bg-ink active:text-bone lg:hidden"
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
          /* The page behind is frozen while this is open. `overflow-y-auto`
             plus `overscroll-contain` below is what still lets a long nav
             scroll on a short screen without the freeze leaking through. */
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
              {NAV.map((item, i) => {
                const current = isCurrent(item.href);

                return (
                  <li key={item.label}>
                    <SectionLink
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={current ? "page" : undefined}
                      /* Set at the size of a heading in running text rather than
                          of a page title. Six entries at display size is a menu
                          that has to be scrolled to be read, and the answer to
                          "where can I go" should fit on the screen at once.

                          The page you are already on is marked in the accent
                          rather than by a rule: there is no row of six to run a
                          rule along here, and a coral word in a column of ink
                          ones is read before it is looked for. */
                      className={cn(
                        "flex items-center gap-4 py-3.5 font-display text-[1.375rem] leading-[1.2] font-medium tracking-[-0.018em] transition-colors active:text-coral",
                        current && "text-coral",
                      )}
                    >
                      {/* A fixed column, so the words start on one edge rather
                          than each one where its own number happened to end. */}
                      <span className="w-5 shrink-0 label-sm tabular text-slate">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {item.label}
                    </SectionLink>
                  </li>
                );
              })}
            </ul>

            {/* `md`, not `lg`. The bar above already carries a Book pill; a
                full-bleed slab at display height repeats it as the loudest
                object on the screen. */}
            <ActionLink href="/book" size="md" className="mt-7" onClick={() => setOpen(false)}>
              Book a free consultation
            </ActionLink>

            {/* The phone's copy of the sign-in link held back in the bar.

                A pill, matching the one above it. It used to be a bare line of
                mono capitals, which put the site's caption face on a control
                and left it ranged hard left under a full-width button — so it
                read as a label describing the button rather than as the second
                thing you could press. Outline rather than ink: this is the
                alternative to the call above, not a rival to it. */}
            <ActionLink
              href="/login"
              variant="outline"
              size="md"
              arrow={false}
              className="mt-3"
              onClick={() => setOpen(false)}
            >
              Sign in to your account
            </ActionLink>

            {/* Pushed to the foot of the panel where there is room for it, and
                simply following the sign-in button where there is not. `size-11`
                because this list only ever appears on a phone, where the target
                is a thumb. */}
            <ul className="mt-auto flex items-center justify-center gap-2.5 border-t border-ash pt-6">
              {SOCIALS.map((s) => {
                const Icon = SOCIAL_ICON[s.code];
                return (
                  <li key={s.code}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="grid size-11 place-items-center rounded-full border border-ink/15 text-slate transition-colors hover:border-ink hover:bg-ink hover:text-bone active:border-ink active:bg-ink active:text-bone"
                    >
                      <Icon className="size-4" />
                      <span className="sr-only">{s.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
