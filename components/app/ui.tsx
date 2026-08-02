import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* The action controls live in their own `"use client"` module — they read the
   surrounding form's pending state — and are re-exported here so a page still
   has one import for the whole kit. */
export { Button, ButtonLink, SubmitButton } from "./button";

/**
 * The pieces every dashboard is built from.
 *
 * Four surfaces do the whole job: a page header, a card, a status pill and an
 * empty state. Collected here rather than repeated because a working surface
 * that a team keeps open all day has to be consistent above all — a card that
 * is 5px tighter on one screen than another reads as a bug in the data.
 *
 * The palette is the site's: bone paper, ink text, ash rules, coral for the one
 * thing that wants attention. Nothing new is introduced for the admin side, so
 * it still reads as the same company.
 */

/**
 * The head of every signed-in page.
 *
 * The monospace caption that used to sit above the title is gone. It said
 * "Admin", "Team" or the company name — which the nav one row above already
 * says, in the same face, at the same size — so the top of every page opened
 * with the same word twice and the heading arrived third.
 */
export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-ash pb-6">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-medium tracking-[-0.015em] text-ink">{title}</h1>
        {meta && <div className="mt-2 text-sm leading-relaxed text-slate">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  return (
    <Tag className={cn("rounded-sheet border border-ash bg-bone-2 p-5 md:p-6", className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="label-sm flex items-baseline gap-2 text-slate">
      {children}
      {typeof count === "number" && <span className="tabular text-ink">{count}</span>}
    </h2>
  );
}

/**
 * Tone is carried by the border and a tint, never by colour alone — the words
 * are always there to read, which is what a colour-blind reader and a printed
 * page both need.
 */
const TONE = {
  neutral: "border-ash text-slate",
  live: "border-ink/30 text-ink",
  good: "border-gold/70 bg-gold/20 text-ink",
  warn: "border-coral/60 bg-coral/10 text-ink",
  done: "border-ash bg-ash/30 text-slate",
} as const;

export type Tone = keyof typeof TONE;

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "label-sm inline-flex items-center rounded-full border px-2.5 py-1",
        TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="mt-10 text-sm leading-relaxed text-slate">{children}</p>;
}

/**
 * What a page or a form says went wrong, or went right.
 *
 * Bounded rather than the bare coloured rule this used to be. A 2px edge with
 * text beside it is the same shape the site uses for a pull quote, and it was
 * the only thing marking the difference between "saved" and "that failed" —
 * two states a person has to be able to tell apart at a glance, from across a
 * desk, without having to read the sentence first.
 */
export function Alert({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "good" }) {
  const warn = tone === "warn";
  const Icon = warn ? CircleAlert : CircleCheck;

  return (
    <p
      role={warn ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-sheet border px-3.5 py-3 text-sm leading-relaxed text-ink",
        warn ? "border-coral/45 bg-coral/10" : "border-gold/60 bg-gold/15",
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", warn ? "text-coral" : "text-ink")} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="label-sm text-slate">{label}</dt>
      <dd className="mt-1 text-sm break-words text-ink">{value}</dd>
    </div>
  );
}

export function Details({ children }: { children: ReactNode }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ash pt-4 sm:grid-cols-4">
      {children}
    </dl>
  );
}

/* Fixed to en-GB rather than the server's locale: the team is in Hyderabad and
   a date that renders month-first on one deploy and day-first on another is a
   date nobody can trust. */
const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE.format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return DATE_TIME.format(new Date(value));
}

/** For a `datetime-local` input, which wants the browser's own local format. */
export function toLocalInput(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
