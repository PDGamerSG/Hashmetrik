import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The frame shared by every way in to the product: client sign-in, sign-up,
 * the staff login, and the suspended-account page.
 *
 * A single centred card on the brand's own paper — bone behind it, a coral
 * kicker above the title, the form inside a bordered sheet. What is actually
 * behind the login is a short, quiet list under the card rather than a second
 * panel: this is a door, not a pitch.
 */

/** One row of the "what's behind this" list under the card. */
export type Reading = { label: string; note: string };

function Lockup() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-70"
    >
      <Image
        src="/logo-hm.png"
        alt=""
        width={64}
        height={64}
        className="size-8 rounded-lg object-cover"
        priority
      />
      <span className="font-display text-xl leading-none font-medium tracking-[-0.022em] text-ink">
        HashMetrik
      </span>
    </Link>
  );
}

/** The quiet list under the card: what is actually behind the login. */
function Contents({ readings }: { readings: readonly Reading[] }) {
  return (
    <ul className="divide-y divide-ash border-y border-ash">
      {readings.map((r) => (
        <li key={r.label} className="flex items-baseline gap-3 py-3.5">
          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-coral" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{r.label}</p>
            <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-slate">{r.note}</p>
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
  /** A short kicker line above the title. */
  statement: string;
  readings: readonly Reading[];
  /** The quiet line under the form — a way to get help, or a caveat. */
  foot?: ReactNode;
  /** Sign-up carries eight fields and needs the wider measure. */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col bg-bone">
      <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <Lockup />
          <span aria-hidden className="hidden h-4 w-px bg-ash sm:block" />
          <span className="hidden text-sm text-slate sm:block">{SITE.tagline}</span>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-slate transition-colors hover:text-ink"
        >
          Back to site
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <div className={cn("w-full", wide ? "max-w-xl" : "max-w-md")}>
          <p className="text-xs font-semibold tracking-[0.14em] text-coral uppercase">
            {statement}
          </p>
          <h1 className="mt-2 font-display text-[2rem] font-medium text-ink sm:text-[2.25rem]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate">{lede}</p>

          <div className="mt-8 rounded-2xl border border-ash bg-bone-2 p-6 shadow-lift sm:p-8">
            {children}
          </div>

          {foot && <p className="mt-6 text-center text-sm leading-relaxed text-slate">{foot}</p>}

          {readings.length > 0 && (
            <div className="mt-10">
              <Contents readings={readings} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
