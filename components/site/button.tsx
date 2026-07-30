import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { SectionLink } from "@/components/site/section-link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost-ink" | "gold";

const VARIANT: Record<Variant, string> = {
  primary: "bg-coral text-bone hover:bg-ink hover:text-bone",
  outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-bone",
  /* On ink surfaces, where a bone hairline is the only edge that reads. */
  "ghost-ink": "border border-bone/25 text-bone hover:bg-bone hover:text-ink",
  gold: "bg-gold text-ink hover:bg-ink hover:text-gold",
};

/**
 * `active:scale` is the touch half of the hover treatments above.
 *
 * Tailwind compiles every `hover:` rule inside `@media (hover: hover)`, so on a
 * phone none of the colour changes below ever run and a tap produces no
 * acknowledgement at all — the button looks broken for the moment it takes the
 * next page to answer. A press that gives under the thumb is the one feedback
 * that works without a pointer, and it is short enough not to read as an
 * animation on a mouse.
 */
const BASE =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-sheet px-6 " +
  "font-mono text-[11px] uppercase tracking-[0.22em] " +
  "transition-[color,background-color,border-color,scale] duration-300 active:scale-[0.97] " +
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

/** The arrow travels on hover — the one micro-interaction shared site-wide. */
function Arrow() {
  return (
    <ArrowUpRight
      aria-hidden
      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
    />
  );
}

export function ActionLink({
  href,
  variant = "primary",
  className,
  children,
  arrow = true,
  ...rest
}: {
  href: string;
  variant?: Variant;
  arrow?: boolean;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const external = href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:");
  const classes = cn(BASE, VARIANT[variant], className);

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
        {children}
        {arrow && <Arrow />}
      </a>
    );
  }

  /* Anchors into the home page scroll without writing a fragment. */
  if (href.includes("#")) {
    return (
      <SectionLink href={href} className={classes} {...rest}>
        {children}
        {arrow && <Arrow />}
      </SectionLink>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

export function ActionButton({
  variant = "primary",
  className,
  children,
  arrow = true,
  ...rest
}: {
  variant?: Variant;
  arrow?: boolean;
} & ComponentProps<"button">) {
  return (
    <button className={cn(BASE, VARIANT[variant], className)} {...rest}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}
