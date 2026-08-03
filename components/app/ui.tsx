import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/* The action controls live in their own `"use client"` module — they read the
   surrounding form's pending state — and are re-exported here so a page still
   has one import for the whole kit. */
export { Button, ButtonLink, SubmitButton } from "./button";

/**
 * The pieces every signed-in page is built from.
 *
 * These surfaces used to be a card and nothing else: every page was a stack of
 * identically sized boxes, one per record, and a page built entirely of cards
 * has no hierarchy left to spend — the count of clients, a single overdue
 * approval and a phone number all arrived in the same rectangle at the same
 * weight. What the marketing side of this site does well, the working side had
 * quietly opted out of.
 *
 * So the instrument vocabulary is here now, at working density: readings ruled
 * into a panel rather than boxed one by one, ledgers of hairline rows instead
 * of stacks of cards, meters where a proportion is the point, and headings
 * registered against a tick scale. The palette is unchanged — bone paper, ink
 * text, ash rules, coral for the one thing that wants a decision — and nothing
 * here moves except in answer to a pointer.
 */

/**
 * The head of every signed-in page.
 *
 * The monospace caption that used to sit above the title is gone. It said
 * "Admin", "Team" or the company name — which the rail already says, in the
 * same face, at the same size — so the top of every page opened with the same
 * word twice and the heading arrived third.
 *
 * The rule underneath is a scale rather than a plain hairline: it is the
 * site's signature, turned on its side for a surface that has no gutter to
 * spare. See `tick-scale` in `globals.css`.
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
    <header>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pb-5">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.85rem,1.15rem+2.2vw,2.5rem)] leading-[1.02] font-medium tracking-[-0.022em] text-balance text-ink">
            {title}
          </h1>
          {meta && <div className="mt-2.5 text-sm leading-relaxed text-slate">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div aria-hidden className="relative h-2.5 text-ink">
        <span className="absolute inset-x-0 top-0 h-px bg-ash" />
        <span className="tick-scale absolute inset-x-0 top-0 h-1.5" />
        <span className="tick-scale-major absolute inset-x-0 top-0 h-2.5" />
      </div>
    </header>
  );
}

/**
 * A band of readings, ruled into one panel.
 *
 * Instruments rule their columns, they do not box them — so this is a single
 * bordered field divided by hairlines, not four cards with four shadows and
 * twelve edges. The rules are the `gap-px` over an ash ground, which means
 * they land correctly however many readings there are and wherever the grid
 * wraps.
 */
export function Readouts({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul
      className={cn(
        "mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-sheet border border-ash bg-ash lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </ul>
  );
}

/**
 * One reading: what it is, how much of it there is, and — where it earns it —
 * the page that has the detail.
 *
 * `urgent` is for the readings that decay if nobody looks today. It does not
 * recolour the figure; it lights a coral pilot beside the label, which is the
 * one motion this surface allows and the same signal the marketing pages use
 * for a live panel.
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
  /** For a second band of standing figures under the headline readings. */
  compact?: boolean;
}) {
  /* Pages hand this a formatted string or a raw number, so both zeroes have to
     be refused — an unlit reading is the whole point of the light. */
  const lit = urgent && value !== 0 && value !== "0";

  return (
    <li className="group relative bg-bone-2 transition-colors hover:bg-bone">
      <div className={cn("px-4 md:px-5", compact ? "py-3.5 md:py-4" : "py-4 md:py-5")}>
        <p className="label-xs flex items-center gap-1.5 text-slate">
          {lit && <span aria-hidden className="pulse-dot size-1.5 rounded-full bg-coral" />}
          {label}
        </p>

        <p
          className={cn(
            "tabular flex items-baseline gap-1.5 font-display leading-[0.9] font-medium tracking-[-0.02em] text-ink",
            compact
              ? "mt-2 text-[1.375rem]"
              : "mt-3 text-[clamp(1.6rem,1rem+1.6vw,2.25rem)]",
          )}
        >
          {value}
          {of !== undefined && <span className="text-sm font-normal text-slate">of {of}</span>}
        </p>

        {note && <p className="mt-2.5 text-xs leading-snug text-slate">{note}</p>}
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
 * A proportion, drawn. Used wherever the comparison between rows is the point
 * — progress against a plan, uptake across the service catalogue — because a
 * column of percentages has to be read one figure at a time.
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
        <span className="label-xs min-w-0 truncate text-slate">{label}</span>
        <span className="tabular shrink-0 text-sm text-ink">{display ?? `${Math.round(pct)}%`}</span>
      </div>
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ash"
      >
        <div
          className={cn("h-full rounded-full", tone === "coral" ? "bg-coral" : "bg-ink")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * A ledger.
 *
 * Records are rows ruled off from one another, not cards stacked with a gap:
 * a hairline is enough to separate two lines of a list, and it lets twelve
 * leads occupy the space four cards used to, which is the difference between
 * reading the queue and scrolling it.
 */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cn("mt-4 divide-y divide-ash border-y border-ash", className)}>{children}</ul>
  );
}

export type RowMeta = { label: string; value: ReactNode };

/**
 * One record on the ledger.
 *
 * `href` stretches over the row rather than wrapping it, so anything
 * interactive passed as `trailing` or `children` still receives its own clicks
 * — those keep their own stacking context via `relative`.
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
    <li className={cn("group relative transition-colors", href && "hover:bg-ink/[0.03]", className)}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <div className="min-w-0 flex-1 basis-52">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* The name of the record *is* the link, stretched over the row by
                the pseudo-element — so the target is the whole line and the
                accessible name is still the thing you are opening. */}
            {href ? (
              <Link
                href={href}
                className="min-w-0 truncate text-[15px] leading-snug font-medium text-ink after:absolute after:inset-0"
              >
                {title}
              </Link>
            ) : (
              <p className="min-w-0 truncate text-[15px] leading-snug font-medium text-ink">
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
          {subtitle && <p className="mt-1 truncate text-sm text-slate">{subtitle}</p>}
        </div>

        {meta?.map((item) => (
          <div key={item.label} className="min-w-0 shrink-0">
            <p className="label-xs text-slate">{item.label}</p>
            <p className="tabular mt-1 truncate text-sm text-ink">{item.value}</p>
          </div>
        ))}

        {status && <div className="shrink-0">{status}</div>}
        {trailing && <div className="relative z-10 ml-auto shrink-0">{trailing}</div>}
      </div>

      {children && <div className="relative z-10 pb-4">{children}</div>}
    </li>
  );
}

/**
 * A section of a page: a named reading, the rule that carries it to the right
 * edge, and whatever the section is about.
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

/**
 * The strip of views a queue can be read in.
 *
 * A filter is a reading on the same scale as the section heads — mono, small,
 * ruled — rather than a row of buttons: choosing "Contacted" is not an action,
 * it is a lens, and it should not look like the thing that saves a record.
 */
export function Filters({ label, children }: { label: string; children: ReactNode }) {
  return (
    <nav aria-label={label} className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {children}
    </nav>
  );
}

export function Filter({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "label-sm inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors",
        active
          ? "border-ink bg-ink text-bone"
          : "border-ash text-slate hover:border-ink/40 hover:text-ink",
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn("tabular", active ? "text-bone/60" : "text-ink")}>{count}</span>
      )}
    </Link>
  );
}

/* One control surface for every input on these pages. They were written out at
   each call site, which is how three different heights and two different focus
   treatments ended up on the same row of the same form. */
const CONTROL =
  "h-10 w-full rounded-sheet border border-ash bg-bone-2 px-3 text-sm text-ink transition-colors " +
  "hover:border-ink/40 focus:border-ink focus:outline-none";

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
      <label htmlFor={id} className={hideLabel ? "sr-only" : "label-xs block text-slate"}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className={cn(
          CONTROL,
          "field-chevron cursor-pointer appearance-none pr-9",
          !hideLabel && "mt-2",
        )}
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
      <label htmlFor={id} className={hideLabel ? "sr-only" : "label-xs block text-slate"}>
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
    <label className="flex cursor-pointer items-center gap-2.5 rounded-sheet px-2 py-1.5 text-sm text-ink transition-colors hover:bg-ink/[0.04]">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="size-4 shrink-0 accent-[var(--color-ink)]"
      />
      <span className="min-w-0 truncate">{children}</span>
    </label>
  );
}

/**
 * A block of a record's editor: what this part of the form is for, ruled off
 * from the part above it. Cards on these pages are editors rather than
 * containers, and an editor with four unlabelled halves is one nobody reads
 * twice the same way.
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
        <p className="label-xs shrink-0 text-slate">{legend}</p>
        <span aria-hidden className="h-px flex-1 bg-ash" />
        {action}
      </div>
      {children}
    </div>
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
    <h2 className="label-sm flex shrink-0 items-baseline gap-2 text-slate">
      {children}
      {typeof count === "number" && <span className="tabular text-ink">{count}</span>}
    </h2>
  );
}

/**
 * Tone is carried by the border and a tint, never by colour alone — the words
 * are always there to read, which is what a colour-blind reader and a printed
 * page both need. The dot is the second, faster read: a queue of thirty rows
 * is scanned down the left edge, not word by word.
 */
const TONE = {
  neutral: { chip: "border-ash text-slate", dot: "bg-slate/50" },
  live: { chip: "border-ink/30 text-ink", dot: "bg-ink" },
  good: { chip: "border-gold/70 bg-gold/20 text-ink", dot: "bg-gold" },
  warn: { chip: "border-coral/60 bg-coral/10 text-ink", dot: "bg-coral" },
  done: { chip: "border-ash bg-ash/30 text-slate", dot: "bg-ash" },
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
        "label-sm inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 whitespace-nowrap",
        TONE[tone].chip,
      )}
    >
      {/* Still, unlike the pilot light on a readout. A queue is thirty rows
          long and half of them are `warn`; thirty blinking dots is not an
          alarm, it is a fairground. */}
      {dot && <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", TONE[tone].dot)} />}
      {children}
    </span>
  );
}

/**
 * What a page says when there is nothing to show.
 *
 * A bare grey sentence was doing this job, which reads as a page that failed
 * to load rather than one with nothing in it yet. A dashed field says the
 * shape is right and the content has not arrived — and where there is
 * something the reader can do about that, the action sits inside it.
 */
export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-4 rounded-sheet border border-dashed border-ash bg-bone-2/50 px-5 py-8">
      <p className="max-w-prose text-sm leading-relaxed text-slate">{children}</p>
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
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
    <div className="min-w-0">
      <dt className="label-xs text-slate">{label}</dt>
      <dd className="mt-1.5 text-sm break-words text-ink">{value}</dd>
    </div>
  );
}

export function Details({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-ash pt-4 sm:grid-cols-4",
        className,
      )}
    >
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
