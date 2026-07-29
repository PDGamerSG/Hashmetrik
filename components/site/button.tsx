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

const BASE =
  "group inline-flex h-12 items-center justify-center gap-2 rounded-sheet px-6 " +
  "font-mono text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 " +
  "disabled:pointer-events-none disabled:opacity-45";

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
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
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
