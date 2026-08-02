import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The frame shared by every way in to the product: client sign-in, sign-up and
 * the staff login.
 *
 * What stood here was a 24rem column floating in the middle of an otherwise
 * empty bone page, headed by a monospace "HASHMETRIK" caption. It was legible
 * and it was nothing else — a visitor arriving from a site built out of ink
 * sections, column rules and measured type met a form with no company attached
 * to it, which is the worst possible moment to look unfinished.
 *
 * So the page is now a spread. The form keeps the left leaf and stays calm:
 * plain paper, one column, a real lockup at the top where the masthead's is on
 * every other page. The right leaf is ink — the darkest surface in the system,
 * and the same one the marketing site uses to change register — carrying a
 * line of display type and a ruled contents list of what is actually behind
 * the login. It is held back below `lg`, where there is no room for a second
 * leaf and a phone wants the form and nothing else; the contents list follows
 * the form instead, so the answer to "what is this for" is on the page at
 * every width.
 */

/** One row of the ink leaf's contents list. */
export type Reading = { label: string; note: string };

function Lockup() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-70"
    >
      {/* Sized against the wordmark's cap height rather than the row, the same
          way the masthead sizes it — the mark is a dark tile, and at row height
          it reads as a black block with a caption beside it. */}
      <Image
        src="/logo-hm.png"
        alt=""
        width={64}
        height={64}
        className="size-7 rounded-sheet object-cover"
        priority
      />
      <span className="font-display text-xl leading-none font-medium tracking-[-0.022em] text-ink">
        HashMetrik
      </span>
    </Link>
  );
}

/**
 * The contents list.
 *
 * Ruled rows rather than a row of cards: this is a table of contents for the
 * thing you are signing in to, and the site already sets every list of parts as
 * ruled rows. Each one carries a short coral tick at the left — the same mark
 * the tick rule is made of, spent once per row, which is what makes the list
 * read as a scale rather than as a menu.
 */
function Contents({ readings, tone }: { readings: readonly Reading[]; tone: "ink" | "paper" }) {
  const onInk = tone === "ink";

  return (
    <ul className={cn("border-t", onInk ? "border-bone/15" : "border-ash")}>
      {readings.map((r) => (
        <li
          key={r.label}
          className={cn(
            "flex items-baseline gap-4 border-b py-4",
            onInk ? "border-bone/15" : "border-ash",
          )}
        >
          <span aria-hidden className="mt-2 h-2.5 w-px shrink-0 bg-coral" />
          <div className="min-w-0">
            <p className={cn("text-[15px] font-medium", onInk ? "text-bone" : "text-ink")}>
              {r.label}
            </p>
            <p
              className={cn(
                "mt-1 text-sm leading-relaxed",
                /* Secondary text on ink is tinted from the paper colour, not
                   greyed — a neutral grey on a warm near-black reads as dirt.
                   Bone at 70% over ink is 8.7:1. */
                onInk ? "text-bone/70" : "text-slate",
              )}
            >
              {r.note}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AuthShell({
  title,
  lede,
  statement,
  readings,
  foot,
  wide = false,
  children,
}: {
  title: string;
  lede: string;
  /** The display line on the ink leaf. */
  statement: string;
  readings: readonly Reading[];
  /** The quiet line under the form — a way to get help, or a caveat. */
  foot?: ReactNode;
  /** Sign-up carries eight fields and needs the wider measure. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    /* `min-h-dvh` sits on the form leaf rather than the grid below `lg`, where
       the grid has two rows: a grid with a minimum height stretches its auto
       rows to fill it, which would have blown the contents list up to half a
       phone screen of white space. */
    <main className="grid lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      {/* ---- the form leaf ------------------------------------------------ */}
      <div className="flex min-h-dvh min-w-0 flex-col lg:min-h-0">
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10 lg:px-14">
          <Lockup />
          <Link
            href="/"
            className="label hidden text-slate transition-colors hover:text-ink sm:inline-block"
          >
            Back to site
          </Link>
        </header>

        <div className="flex flex-1 flex-col justify-center px-6 pt-4 pb-14 sm:px-10 lg:px-14">
          <div className={cn("w-full", wide ? "max-w-xl" : "max-w-md")}>
            <h1 className="display text-[2.5rem] text-ink sm:text-[3rem]">{title}</h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-slate">{lede}</p>

            <div className="mt-9">{children}</div>

            {foot && (
              <p className="mt-9 border-t border-ash pt-6 text-sm leading-relaxed text-slate">
                {foot}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ---- the ink leaf -------------------------------------------------- */}
      {/* Pinned to the viewport rather than run to the height of the column:
          sign-up is two screens tall, and a leaf that scrolls away leaves the
          longest form on the site with nothing beside it for its second half. */}
      <aside className="relative hidden bg-ink text-bone lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          {/* The column rules, carried over from the marketing site so the two
              halves of the product are visibly printed on the same paper. */}
          <div aria-hidden className="rule-field pointer-events-none absolute inset-0 text-bone" />
          {/* The scale, on the join. */}
          <div aria-hidden className="tick-rule absolute inset-y-0 left-0 w-px text-bone" />

          {/* Statement and list are one centred group. Held apart at the two
              ends of the leaf they left a screen's worth of nothing between
              them, which reads as a panel that failed to load rather than as
              space anyone chose. */}
          <div className="relative flex flex-1 flex-col justify-center gap-10 overflow-y-auto px-12 py-12 xl:gap-12 xl:px-16">
            <p className="display max-w-[15ch] text-[2.25rem] text-bone xl:text-[2.5rem]">
              {statement}
            </p>
            <Contents readings={readings} tone="ink" />
          </div>

          <div className="relative border-t border-bone/15 px-12 py-5 xl:px-16">
            <p className="label text-bone/55">{SITE.tagline}</p>
          </div>
        </div>
      </aside>

      {/* The ink leaf's list again, on paper, for the widths that never see it.
          Same content, set as the page's own last section rather than as a
          shrunken copy of a panel that is not there. */}
      <section className="border-t border-ash px-6 py-12 sm:px-10 lg:hidden">
        <p className="display max-w-[18ch] text-[1.75rem] text-ink">{statement}</p>
        <div className="mt-8">
          <Contents readings={readings} tone="paper" />
        </div>
      </section>
    </main>
  );
}
