"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one action control for every signed-in surface.
 *
 * Two behaviours worth keeping. `useFormStatus` is read here rather than at
 * every call site, so any button inside a `<form action={…}>` reports its own
 * round trip without the page threading a `pending` flag down; forms that
 * already own that state through `useActionState` pass `pending` explicitly
 * and win. And a waiting button is disabled without being dimmed: fading the
 * face would take "Saving…" down with it, and that word is the one thing on
 * the page being read at that moment.
 */

type Variant = "primary" | "quiet" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-bone shadow-sm hover:bg-ink/90",
  quiet: "border border-ash bg-bone-2 text-ink hover:border-slate/50 hover:bg-ash/40",
  /* Reserved for the actions that take something away. Outlined and coral
     rather than filled: a destructive control should be findable, not the
     loudest thing on the page. */
  danger: "border border-coral/40 text-coral hover:border-coral hover:bg-coral/10",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 gap-2 px-3.5 text-[0.8125rem]",
  md: "h-11 gap-2 px-4 text-sm",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-lg font-medium " +
  "whitespace-nowrap transition-colors duration-150 " +
  "disabled:pointer-events-none disabled:opacity-50";

const BUSY = "pointer-events-none disabled:opacity-100";

function Busy() {
  return <LoaderCircle aria-hidden className="size-3.5 animate-spin" />;
}

export function Button({
  variant = "primary",
  size = "md",
  pending,
  busyLabel,
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  /** For forms that already track it via `useActionState`. */
  pending?: boolean;
  /** What the button says while it waits. Defaults to the resting label. */
  busyLabel?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "children">) {
  /* Zero-cost outside a form: `useFormStatus` returns `pending: false` when the
     button has no form above it, which is what the disclosure toggles want. */
  const status = useFormStatus();
  const busy = pending ?? (rest.type === "submit" ? status.pending : false);

  return (
    <button
      {...rest}
      disabled={rest.disabled || busy}
      className={cn(BASE, VARIANT[variant], SIZE[size], busy && BUSY, className)}
    >
      {busy && <Busy />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}

/** The submit button, which is the same button with its type filled in. */
export function SubmitButton({ children, ...rest }: Omit<ComponentProps<typeof Button>, "type">) {
  return (
    <Button type="submit" {...rest}>
      {children}
    </Button>
  );
}

/** Navigation drawn as an action — "Go to your work", "Open". */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "children">) {
  return (
    <Link {...rest} className={cn(BASE, VARIANT[variant], SIZE[size], className)}>
      {children}
    </Link>
  );
}
