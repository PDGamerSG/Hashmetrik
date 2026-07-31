import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { SectionLink } from "@/components/site/section-link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "bone" | "outline" | "ghost-ink" | "gold";
type Size = "sm" | "md" | "lg";

/**
 * The call to action, redrawn.
 *
 * What stood here was a filled coral rectangle carrying eleven pixels of
 * letter-spaced monospace capitals. Two things were wrong with it. The label
 * was set in the face this site reserves for *readings* — codes, ticks and
 * numbers — so the one element on the page a visitor is meant to press was
 * dressed as a measurement of something. And a saturated slab of the brand
 * colour repeated eight times down a page spends the accent entirely: by the
 * fourth one it is wallpaper, and nothing is emphasised because everything is.
 *
 * So: the accent is now a token rather than a field. The button is an ink pill
 * with the brand colour held in a single disc at its end, the way a good
 * letterhead spends its one spot colour. The label is sentence-case text in
 * the text face at a readable size, because it is a sentence and it is meant
 * to be read. And ink against paper is the strongest contrast available here,
 * which means the button is now the darkest thing on the page — emphasis by
 * value rather than by hue.
 *
 * Hover inverts the two: the pill takes the accent, the disc takes the ink.
 * The colour is still there; it simply arrives when you reach for it.
 */

/** Pill, then disc. Both invert on hover — see the note above. */
const VARIANT: Record<Variant, { pill: string; disc: string }> = {
  primary: {
    pill: "bg-ink text-bone hover:bg-coral hover:text-ink",
    disc: "bg-coral text-ink group-hover:bg-ink group-hover:text-bone",
  },
  /* `primary` inverted, for the ink sections — where an ink pill is a button
     with no edges at all and only the disc survives. */
  bone: {
    pill: "bg-bone text-ink hover:bg-coral",
    disc: "bg-coral text-ink group-hover:bg-ink group-hover:text-bone",
  },
  outline: {
    pill: "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-bone",
    disc: "bg-ink/8 text-ink group-hover:bg-coral group-hover:text-ink",
  },
  /* On ink surfaces, where a bone hairline is the only edge that reads. */
  "ghost-ink": {
    pill: "border border-bone/20 text-bone hover:border-bone hover:bg-bone hover:text-ink",
    disc: "bg-bone/12 text-bone group-hover:bg-coral group-hover:text-ink",
  },
  gold: {
    pill: "bg-gold text-ink hover:bg-ink hover:text-gold",
    disc: "bg-ink text-gold group-hover:bg-gold group-hover:text-ink",
  },
};

/**
 * Height, type size and the padding either side.
 *
 * The right-hand padding is small and the left-hand padding is not: the disc
 * sits in the pill's own end cap, so the optical centre of the label stays put
 * whether or not the button carries an arrow. `flat` is the padding used when
 * it does not.
 */
const SIZE: Record<Size, { pill: string; padded: string; flat: string; disc: string }> = {
  sm: { pill: "h-10 gap-2.5 text-[13px]", padded: "pl-4 pr-1", flat: "px-4", disc: "size-8" },
  md: { pill: "h-12 gap-3 text-[14px]", padded: "pl-6 pr-1.5", flat: "px-6", disc: "size-9" },
  lg: { pill: "h-14 gap-4 text-[15px]", padded: "pl-7 pr-2", flat: "px-7", disc: "size-10" },
};

/**
 * `active:scale` is the touch half of the treatments above.
 *
 * Tailwind compiles every `hover:` rule inside `@media (hover: hover)`, so on a
 * phone neither the colour inversion nor the label roll ever runs and a tap
 * produces no acknowledgement at all — the button looks broken for the moment
 * it takes the next page to answer. A press that gives under the thumb is the
 * one feedback that works without a pointer, and it is short enough not to
 * read as an animation on a mouse.
 */
const BASE =
  "group relative inline-flex items-center justify-center rounded-full font-sans font-medium " +
  "whitespace-nowrap transition-[color,background-color,border-color,scale] duration-500 " +
  "ease-[var(--ease-out-quint)] active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-45";

/**
 * The router's own props, which a plain `<a>` has no use for.
 *
 * `ActionLink` takes `next/link`'s full prop type so that internal links can be
 * given `prefetch` or `replace`, but an external href renders a bare anchor —
 * and React warns about every one of these if it reaches the DOM.
 */
const ROUTER_PROPS = [
  "as",
  "replace",
  "scroll",
  "shallow",
  "passHref",
  "prefetch",
  "legacyBehavior",
  "onNavigate",
] as const;

function anchorPropsOf(rest: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...rest };
  for (const key of ROUTER_PROPS) delete out[key];
  return out as ComponentProps<"a">;
}

/**
 * The label, on a roll.
 *
 * Two copies of the text in one grid cell, one above the clip and one below
 * it, so the words leave upwards and their replacements arrive from beneath.
 * The site's single micro-interaction, and the only reason a visitor would
 * hover a button for its own sake.
 *
 * `leading` is generous on purpose: the clip is the line box, and at a tighter
 * leading the descender of a "g" is shaved off while the button sits at rest.
 * The copy is `aria-hidden`, so a screen reader is read the label once.
 */
function Rolling({ children }: { children: ReactNode }) {
  const face =
    "col-start-1 row-start-1 flex items-center gap-2 leading-[1.45] " +
    "transition-transform duration-500 ease-[var(--ease-out-quint)]";

  return (
    <span className="inline-grid overflow-hidden">
      <span className={cn(face, "group-hover:-translate-y-[130%]")}>{children}</span>
      <span aria-hidden className={cn(face, "translate-y-[130%] group-hover:translate-y-0")}>
        {children}
      </span>
    </span>
  );
}

/** The end cap: one disc of the brand colour, holding the arrow. */
function Disc({ variant, size }: { variant: Variant; size: Size }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-full transition-colors duration-500 ease-[var(--ease-out-quint)]",
        SIZE[size].disc,
        VARIANT[variant].disc,
      )}
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

function classesFor(variant: Variant, size: Size, arrow: boolean, className?: string) {
  return cn(
    BASE,
    VARIANT[variant].pill,
    SIZE[size].pill,
    arrow ? SIZE[size].padded : SIZE[size].flat,
    className,
  );
}

export function ActionLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  arrow = true,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const classes = classesFor(variant, size, arrow, className);
  const body = (
    <>
      <Rolling>{children}</Rolling>
      {arrow && <Disc variant={variant} size={size} />}
    </>
  );

  if (external) {
    /* `mailto:` and `tel:` hand off to another application rather than opening
       a page, so forcing a new tab only leaves an empty one behind. */
    const newTab = href.startsWith("http");

    /* Everything the caller passed has to survive the branch — an `onClick`
       that closes the mobile menu, an `aria-*`, an `id`. This used to render a
       bare anchor and drop `rest` on the floor, so an external link inside the
       menu opened its tab and left the menu sitting over the page. */
    return (
      <a
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
        className={classes}
        {...anchorPropsOf(rest)}
      >
        {body}
      </a>
    );
  }

  /* Anchors into the home page scroll without writing a fragment. */
  if (href.includes("#")) {
    return (
      <SectionLink href={href} className={classes} {...rest}>
        {body}
      </SectionLink>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {body}
    </Link>
  );
}

export function ActionButton({
  variant = "primary",
  size = "md",
  className,
  children,
  arrow = true,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
} & ComponentProps<"button">) {
  return (
    <button className={classesFor(variant, size, arrow, className)} {...rest}>
      <Rolling>{children}</Rolling>
      {arrow && <Disc variant={variant} size={size} />}
    </button>
  );
}
