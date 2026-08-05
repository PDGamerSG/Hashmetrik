"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SubmitButton } from "@/components/app/button";
import { NavLinks, type NavLink } from "@/components/app/nav-links";
import { cn } from "@/lib/utils";

/**
 * The signed-in shell: a fixed sidebar and the page beside it.
 *
 * The sidebar is a column rather than a bar across the top, and stays one at
 * every width above a phone: the admin area alone has ten sections, and as a
 * strip they wrap onto a second row on a laptop and scroll sideways below
 * that, which is the point a navigation stops telling you what exists.
 *
 * Links are passed in rather than derived here, because which ones exist is a
 * question about the viewer's role and that answer belongs next to the
 * session. `signOut` is passed for the same reason: the admin area returns to
 * its own login page, the rest to the public one. Sign-out stays a form
 * rather than a link because it changes state, and a link that changes state
 * is one prefetch away from signing people out by accident.
 *
 * Client, because the drawer below `md` is state and a layout has none.
 * `children` are still server-rendered; they arrive as a prop and pass
 * through.
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
      {/* The phone bar. It carries the mark and the way into the sidebar and
          nothing else: the sections are one tap away rather than a strip of
          pills scrolling sideways off the edge of a 360px screen. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ash bg-bone-2 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${area.toLowerCase()} sections`}
          aria-expanded={open}
          aria-controls="app-sidebar"
          className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          <Menu aria-hidden className="size-5" />
        </button>
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <Image
            src="/logo-hm.png"
            alt=""
            width={64}
            height={64}
            className="size-6 rounded-[6px] object-cover"
          />
          <span className="font-display text-lg font-medium text-ink">HashMetrik</span>
        </Link>
        <span className="ml-auto text-xs font-medium tracking-wide text-slate uppercase">
          {area}
        </span>
      </header>

      {/* Under the drawer, not under the sidebar: it only exists while the
          drawer is open, and it is the second way out of it after Escape. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 ease-[var(--ease-out-quint)] md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="app-sidebar"
        /* Below `md` the sidebar is a drawer over the page, so following a
           link has to put it away — otherwise the page you just asked for
           renders underneath it. Delegated from the panel rather than watched
           for as a change of pathname: the drawer closes because you used it,
           which is also true when the link you press is the page you are
           already on. */
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col border-r border-ash bg-bone-2",
          "transition-[transform,visibility] duration-300 ease-[var(--ease-out-quint)]",
          /* Sticky rather than fixed from `md` up, and `self-start` so the
             flex row does not stretch it — a stretched item has no height of
             its own to stick against, and the sidebar scrolls away with the
             page. */
          "md:visible md:sticky md:top-0 md:z-30 md:h-dvh md:w-64 md:shrink-0 md:translate-x-0 md:self-start",
          open ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="relative flex items-center gap-2.5 border-b border-ash px-4 py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo-hm.png"
              alt=""
              width={64}
              height={64}
              className="size-7 rounded-[6px] object-cover"
            />
            <span className="font-display text-xl font-medium text-ink">HashMetrik</span>
          </Link>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close sections"
            className="-mr-1 ml-auto inline-flex size-9 items-center justify-center rounded-md text-slate transition-colors hover:bg-ink/[0.06] hover:text-ink md:hidden"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        {/* Which area you are standing in. A label on what you are looking at
            rather than a heading, so the pages below do not have to repeat it
            in their own titles. */}
        <p className="px-4 pt-5 pb-3 text-xs font-semibold tracking-wide text-slate uppercase">
          {area}
        </p>

        <NavLinks area={area} links={links} />

        {/* Pinned to the bottom of the sidebar — the account you are signed
            in as is a question you ask last. */}
        <div className="mt-auto border-t border-ash px-4 py-4">
          <p className="truncate text-[0.8125rem] text-slate" title={email}>
            {email}
          </p>
          <form action={signOut} className="mt-3">
            <SubmitButton variant="quiet" size="sm" busyLabel="Signing out…" className="w-full">
              Sign out
            </SubmitButton>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-bone">
        <div className="mx-auto w-full max-w-[80rem] px-6 py-8 pb-16 md:px-10 md:py-10 md:pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { NavLink };
