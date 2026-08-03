"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SubmitButton } from "@/components/app/button";
import { NavLinks, type NavLink } from "@/components/app/nav-links";
import { cn } from "@/lib/utils";

/**
 * The shell around every signed-in page: a rail down the left, and the page
 * beside it.
 *
 * The rail is ink. It was bone, like everything else on these pages, and a
 * navigation printed on the same paper as the page it navigates has nothing to
 * separate the two — the eye reads one continuous sheet with some indented text
 * down the left of it. Ink beside bone is the mark itself, and it does the work
 * a second neutral layer does in any working interface: the frame is the app,
 * the paper is the job.
 *
 * This was a bar across the top. It ran out of room — ten sections in the admin
 * area, each one a pill on a single line shared with the wordmark, the area
 * label, an email address and a sign-out button — so the links wrapped onto a
 * second row on a laptop and scrolled sideways below that, which is the point a
 * navigation stops telling you what exists. A column has as much room as it
 * needs and, unlike a strip, the whole list stays on screen while you read the
 * page, so the sections read as a set rather than as whatever fits.
 *
 * Links are passed in rather than derived here, because which ones exist is a
 * question about the viewer's role and that answer belongs next to the session.
 * `signOut` is passed for the same reason: the admin area returns to its own
 * login page, the rest to the public one. Sign-out stays a form rather than a
 * link because it changes state, and a link that changes state is one prefetch
 * away from signing people out by accident.
 *
 * Client, because the drawer below `md` is state and a layout has none — and
 * because marking the current link cannot be done up here at all: a layout
 * renders once and never again on navigation, so the mark would stay on the
 * page you left. See `nav-links.tsx`. `children` are still server-rendered;
 * they arrive as a prop and pass straight through.
 */
export function AppShell({
  area,
  email,
  links,
  signOut,
  children,
}: {
  area: string;
  email: string;
  links: NavLink[];
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    /* Focus moves into the panel, so Escape and Tab are where the reader is,
       and the page behind stops scrolling under the overlay. */
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      {/* The phone bar. It carries the wordmark and the way into the rail and
          nothing else: the sections are one tap away rather than a strip of
          pills scrolling sideways off the edge of a 360px screen. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ash-ink bg-ink/90 px-5 py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${area.toLowerCase()} sections`}
          aria-expanded={open}
          aria-controls="app-rail"
          className="-ml-2 inline-flex size-9 items-center justify-center rounded-full text-haze transition-colors hover:bg-bone/10 hover:text-bone"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo-hm.png"
            alt=""
            width={64}
            height={64}
            className="size-6 rounded-sheet object-cover"
          />
          <span className="font-display text-lg leading-none font-medium tracking-[-0.018em] text-bone">
            HashMetrik
          </span>
        </Link>
        <span className="label-sm ml-auto text-haze-2">{area}</span>
      </header>

      {/* Under the drawer, not under the rail: it only exists while the drawer
          is open, and it is the second way out of it after Escape. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 ease-[var(--ease-out-quint)] md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="app-rail"
        /* Below `md` the rail is a drawer over the page, so following a link
           has to put it away — otherwise the page you just asked for renders
           underneath it. Delegated from the panel rather than watched for as a
           change of pathname: the drawer closes because you used it, which is
           also true when the link you press is the page you are already on. */
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-ash-ink bg-ink",
          "transition-[transform,visibility] duration-300 ease-[var(--ease-out-quint)]",
          /* Sticky rather than fixed from `md` up, and `self-start` so the flex
             row does not stretch it — a stretched item has no height of its own
             to stick against, and the rail scrolls away with the page. */
          "md:sticky md:top-0 md:z-30 md:h-dvh md:w-60 md:shrink-0 md:translate-x-0 md:self-start md:visible lg:w-64",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        {/* The scale the marketing pages run down their gutter, kept as the
            rail's own edge: this column is the app's left margin, so it is the
            one place the signature still fits at working density. */}
        <span
          aria-hidden
          className="tick-rule pointer-events-none absolute inset-y-0 right-0 hidden w-1.5 text-bone md:block"
        />

        {/* The same light that falls across the head of each page, entering the
            rail from the top so the two ink surfaces are lit from one window
            rather than being two unrelated dark rectangles. */}
        <span aria-hidden className="console-light pointer-events-none absolute inset-x-0 top-0 h-64" />

        <div className="relative flex items-center gap-2.5 border-b border-ash-ink px-5 py-3.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo-hm.png"
              alt=""
              width={64}
              height={64}
              className="size-6 rounded-sheet object-cover"
            />
            <span className="font-display text-lg leading-none font-medium tracking-[-0.018em] text-bone">
              HashMetrik
            </span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close sections"
            className="-mr-2 ml-auto inline-flex size-9 items-center justify-center rounded-full text-haze transition-colors hover:bg-bone/10 hover:text-bone md:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {/* The area, set as a reading over the list rather than as a heading:
            it is a label on what you are looking at, and the pages below no
            longer repeat it in their own headings. */}
        <p className="label-sm relative px-5 pt-5 pb-2 text-haze-2">{area}</p>

        <NavLinks area={area} links={links} />

        {/* Pinned to the bottom of the rail — the account you are signed in as
            is the answer to a question you ask last, not first. */}
        <div className="relative mt-auto border-t border-ash-ink px-5 py-4">
          <p className="truncate text-[13px] text-haze-2" title={email}>
            {email}
          </p>
          <form action={signOut} className="mt-3">
            <SubmitButton variant="onInk" size="sm" busyLabel="Signing out…" className="w-full">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 pb-14 md:px-10 md:py-10 md:pb-16">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { NavLink };
