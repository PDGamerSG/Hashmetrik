import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* The action controls live in their own `"use client"` module and are
   re-exported here so a page still has one import for the whole kit. The
   segmented control is client for its own reason: the active pill slides
   between filters, which is a shared layout and needs the browser. */
export { Button, ButtonLink, SubmitButton } from "./button";
export { Filters, Filter } from "./filters";
/** The dial — see `components/ui/gauge.tsx`. Re-exported here so a page still
 * has one import for the whole kit. */
export { Dial } from "@/components/ui/gauge";

/**
 * The pieces every signed-in page is built from.
 *
 * A conventional dashboard kit — cards, a KPI band, a queue of rows, a
 * status badge — built off the same brand tokens as the public site: bone
 * paper, ink text, coral for anything that is asking for a decision, gold for
 * something running, green for cleared. Every signed-in page imports from
 * here and nothing else, so a colour or a radius changed once changes
 * everywhere.
 */

/* ==========================================================================
   The head of a page
   ========================================================================== */

/**
 * The title bar at the top of every signed-in page: what this page is, the
 * one-line description under it, a short status badge if there is a single
 * reading worth calling out, and the primary action on the right.
 */
export function PageHeader({
  title,
  meta,
  actions,
  status,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  /** A short reading worth calling out beside the title — "3 waiting on you". */
  status?: string;
}) {
  return (
    <header className="border-b border-ash pb-6">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          {status && (
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-coral uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-coral" />
              {status}
            </p>
          )}
          <h1 className="font-display text-[clamp(1.75rem,1.2rem+1.8vw,2.5rem)] font-medium text-balance text-ink">
            {title}
          </h1>
          {meta && (
            <div className="mt-2.5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-slate">
              {meta}
            </div>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ==========================================================================
   KPI band
   ========================================================================== */

/**
 * The readings across the top of a page, as a row of stat cards.
 */
export function Readouts({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn("mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>{children}</ul>
  );
}

/**
 * One stat card.
 *
 * `urgent` is for the readings that decay if nobody looks today — it marks
 * the label with a coral dot. The figure itself always stays ink: a warning
 * lights the lamp beside a dial, it does not recolour the reading.
 */
export function Readout({
  label,
  value,
  of,
  note,
  href,
  urgent,
  compact,
}: {
  label: string;
  value: ReactNode;
  /** The whole the value is part of — "12 of 340". */
  of?: ReactNode;
  note?: ReactNode;
  href?: string;
  urgent?: boolean;
  /** For a second, denser band of standing figures. */
  compact?: boolean;
}) {
  /* Pages hand this a formatted string or a raw number, so both zeroes have
     to be refused — an unmarked reading is the whole point of the dot. */
  const lit = urgent && value !== 0 && value !== "0";

  return (
    <li
      className={cn(
        "group relative rounded-xl border bg-bone-2 shadow-sm transition-colors",
        lit ? "border-coral/30" : "border-ash",
        href && "hover:border-slate/40",
      )}
    >
      <div className={cn("px-4 md:px-5", compact ? "py-4" : "py-5")}>
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate uppercase">
          {lit && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-coral" />}
          {label}
        </p>

        <p
          className={cn(
            "flex items-baseline gap-2 font-display font-medium text-ink tabular-nums",
            compact ? "mt-2.5 text-2xl" : "mt-3 text-[clamp(1.75rem,1.1rem+1.6vw,2.25rem)]",
          )}
        >
          {value}
          {of !== undefined && <span className="text-sm font-medium text-slate">of {of}</span>}
        </p>

        {note && <p className="mt-2 text-[0.8125rem] leading-snug text-slate">{note}</p>}
      </div>

      {href && (
        <>
          {/* Stretched over the whole cell, so the target is the reading and
              not four words of label. */}
          <Link href={href} className="absolute inset-0" aria-label={`${label} — open`} />
          <ArrowUpRight
            aria-hidden
            className="absolute top-4 right-4 size-3.5 text-slate opacity-0 transition-opacity group-hover:opacity-100"
          />
        </>
      )}
    </li>
  );
}

/**
 * A proportion, drawn as a bar in a track.
 *
 * For a *column* of proportions — uptake across the service catalogue,
 * milestones across five projects — because bars stacked in a column share a
 * left edge and can be compared down it at a glance. When there is one
 * proportion and it is the headline of the thing it sits on, `Dial` is the
 * instrument instead — see `components/ui/gauge.tsx`.
 */
export function Meter({
  label,
  value,
  max = 100,
  display,
  tone = "ink",
}: {
  label: ReactNode;
  value: number;
  max?: number;
  /** What to print as the reading. Defaults to `value` of `max`. */
  display?: ReactNode;
  tone?: "ink" | "coral";
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="min-w-0 truncate text-sm font-medium text-slate">{label}</span>
        <span className="shrink-0 text-sm font-semibold text-ink tabular-nums">
          {display ?? `${Math.round(pct)}%`}
        </span>
      </div>

      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ash"
      >
        <div
          className={cn(
            "meter-fill h-full rounded-full",
            tone === "coral" ? "bg-coral" : "bg-ink",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   The queue
   ========================================================================== */

/**
 * A list of records.
 */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "mt-4 overflow-hidden rounded-xl border border-ash bg-bone-2 shadow-sm",
        "divide-y divide-ash",
        className,
      )}
    >
      {children}
    </ul>
  );
}

export type RowMeta = { label: string; value: ReactNode };

/**
 * One record.
 *
 * `href` stretches over the row rather than wrapping it, so anything
 * interactive passed as `trailing` or `children` still receives its own
 * clicks — those keep their own stacking context via `relative`.
 */
export function Row({
  title,
  subtitle,
  meta,
  status,
  trailing,
  href,
  children,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: RowMeta[];
  status?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "group relative transition-colors duration-150",
        href && "hover:bg-bone",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5 md:px-5">
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* The name of the record *is* the link, stretched over the row by
                the pseudo-element — so the target is the whole line and the
                accessible name is still the thing you are opening. */}
            {href ? (
              <Link
                href={href}
                className="min-w-0 truncate text-[0.9375rem] leading-snug font-medium text-ink after:absolute after:inset-0"
              >
                {title}
              </Link>
            ) : (
              <p className="min-w-0 truncate text-[0.9375rem] leading-snug font-medium text-ink">
                {title}
              </p>
            )}
            {href && (
              <ArrowUpRight
                aria-hidden
                className="size-3.5 shrink-0 text-slate opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
          </div>
          {subtitle && <p className="mt-1 truncate text-[0.8125rem] text-slate">{subtitle}</p>}
        </div>

        {meta?.map((item) => (
          <div key={item.label} className="min-w-0 shrink-0">
            <p className="text-[0.6875rem] font-medium tracking-wide text-slate uppercase">
              {item.label}
            </p>
            <p className="mt-1 truncate text-sm text-ink">{item.value}</p>
          </div>
        ))}

        {status && <div className="shrink-0">{status}</div>}
        {trailing && <div className="relative z-10 ml-auto shrink-0">{trailing}</div>}
      </div>

      {children && <div className="relative z-10 px-4 pb-4 md:px-5">{children}</div>}
    </li>
  );
}

/**
 * A section of a page: what this block of records is, the rule that carries
 * the name to the right edge, and the records themselves.
 */
export function Section({
  title,
  count,
  action,
  children,
  className,
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-12", className)}>
      <div className="flex items-center gap-4">
        <SectionTitle count={count}>{title}</SectionTitle>
        <span aria-hidden className="h-px flex-1 bg-ash" />
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="flex shrink-0 items-baseline gap-2.5 text-lg font-semibold text-ink">
      {children}
      {typeof count === "number" && (
        <span className="text-sm font-medium text-slate tabular-nums">{count}</span>
      )}
    </h2>
  );
}

/* `Filters` / `Filter` live in `./filters` and are re-exported at the top of
   this file. */

/* ==========================================================================
   Controls
   ========================================================================== */

const CONTROL =
  "h-11 w-full rounded-lg border border-ash bg-bone-2 px-3 " +
  "text-sm text-ink shadow-sm transition-colors " +
  "placeholder:text-slate/70 hover:border-slate/40 " +
  "focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral/20";

export function Select({
  id,
  name,
  label,
  hideLabel,
  defaultValue,
  children,
  className,
}: {
  id: string;
  name: string;
  label: string;
  /** For a control whose column heading already names it. */
  hideLabel?: boolean;
  defaultValue?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "block text-sm font-medium text-slate"}
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={cn(CONTROL, "field-chevron cursor-pointer appearance-none pr-9", !hideLabel && "mt-2")}
      >
        {children}
      </select>
    </div>
  );
}

export function Input({
  id,
  name,
  label,
  hideLabel,
  type = "text",
  defaultValue,
  className,
  ...rest
}: {
  id: string;
  name: string;
  label: string;
  hideLabel?: boolean;
  type?: string;
  defaultValue?: string;
  className?: string;
} & Omit<React.ComponentProps<"input">, "id" | "name" | "type" | "defaultValue" | "className">) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "block text-sm font-medium text-slate"}
      >
        {label}
      </label>
      <input
        {...rest}
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className={cn(CONTROL, !hideLabel && "mt-2")}
      />
    </div>
  );
}

/** A checkbox and its name, sized so the whole line is the target. */
export function Check({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-ink transition-colors hover:bg-ash/40">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 shrink-0 accent-coral"
      />
      <span className="min-w-0 truncate">{children}</span>
    </label>
  );
}

/**
 * A block of a record's editor: what this part of the form is for, ruled off
 * from the part above it.
 */
export function Fieldset({
  legend,
  children,
  action,
}: {
  legend: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  /* A `role="group"` with a label of its own rather than a real `<fieldset>`:
     a `<legend>` has to be the first child of the fieldset to count as one,
     which rules out setting it on a line with the rule and the save button
     beside it. `aria-label` rather than `aria-labelledby` because a page
     renders one of these per record — twenty groups called "Services" would
     need twenty distinct ids to point at. */
  return (
    <div role="group" aria-label={legend} className="mt-5 border-t border-ash pt-5">
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-slate">{legend}</p>
        <span aria-hidden className="h-px flex-1 bg-ash" />
        {action}
      </div>
      {children}
    </div>
  );
}

/**
 * A card: the surface for anything that is edited rather than scanned.
 */
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
    <Tag className={cn("rounded-xl border border-ash bg-bone-2 p-5 shadow-sm md:p-6", className)}>
      {children}
    </Tag>
  );
}

/* ==========================================================================
   Status
   ========================================================================== */

/**
 * Tone is carried by a dot and the word beside it, never by colour alone —
 * the words are always there to read, which is what a colour-blind reader
 * and a printed page both need. The dot is the second, faster read: a queue
 * of thirty rows is scanned down its status column, not word by word.
 */
const TONE = {
  neutral: { text: "text-slate", dot: "bg-slate" },
  live: { text: "text-[#8a6a0c]", dot: "bg-gold" },
  good: { text: "text-go", dot: "bg-go" },
  warn: { text: "text-coral", dot: "bg-coral" },
  done: { text: "text-slate/70", dot: "bg-slate/40" },
} as const;

export type Tone = keyof typeof TONE;

export function Pill({
  tone = "neutral",
  dot,
  children,
}: {
  tone?: Tone;
  /** Adds the status dot. On for anything that changes state; off for labels. */
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap",
        TONE[tone].text,
      )}
    >
      {dot && <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TONE[tone].dot)} />}
      {children}
    </span>
  );
}

/**
 * What a page says when there is nothing to show.
 */
export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-ash bg-bone-2/60 px-5 py-9">
      <p className="max-w-[60ch] text-sm leading-relaxed text-slate">{children}</p>
      {action && <div className="mt-5 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

/**
 * What a page or a form says went wrong, or went right.
 *
 * Two states a person has to tell apart at a glance, from across a desk,
 * without having to read the sentence first — so each gets its own icon and
 * its own tinted field, and neither relies on colour alone.
 */
export function Alert({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "good" }) {
  const warn = tone === "warn";
  const Icon = warn ? CircleAlert : CircleCheck;

  return (
    <p
      role={warn ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm leading-relaxed text-ink",
        warn ? "border-coral/30 bg-coral/5" : "border-go/30 bg-go/5",
      )}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", warn ? "text-coral" : "text-go")} />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-slate uppercase">{label}</dt>
      <dd className="mt-1.5 text-sm break-words text-ink">{value}</dd>
    </div>
  );
}

export function Details({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "mt-4 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ash pt-4 sm:grid-cols-4",
        className,
      )}
    >
      {children}
    </dl>
  );
}

/* ==========================================================================
   Readings
   ========================================================================== */

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

/** Grouped thousands, so four figures in a column line up as a quantity. */
export function formatCount(value: number): string {
  return value.toLocaleString("en-GB");
}

/** For a `datetime-local` input, which wants the browser's own local format. */
export function toLocalInput(value: Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
