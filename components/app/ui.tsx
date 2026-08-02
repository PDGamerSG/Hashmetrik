import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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

export function PageHeader({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ash pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="label-sm text-slate">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {meta && <div className="mt-2 text-sm text-slate">{meta}</div>}
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

export function Alert({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "good" }) {
  return (
    <p
      role="alert"
      className={cn(
        "border-l-2 pl-4 text-sm leading-relaxed",
        tone === "warn" ? "border-coral text-ink" : "border-gold text-ink",
      )}
    >
      {children}
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

/** The submit button used across every dashboard form. */
export function SubmitButton({
  children,
  pending,
  variant = "primary",
}: {
  children: ReactNode;
  pending?: boolean;
  variant?: "primary" | "quiet";
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "h-10 rounded-sheet px-4 text-[13px] transition-colors disabled:pointer-events-none disabled:opacity-40",
        variant === "primary"
          ? "bg-ink text-bone hover:bg-coral hover:text-ink"
          : "border border-ash text-ink hover:border-ink hover:bg-bone-2",
      )}
    >
      {children}
    </button>
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
