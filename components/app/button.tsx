"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The one action control for every signed-in surface.
 *
 * Two things were wrong with what stood here. Every page drew its own: a square
 * ink slab in one place, an ash-bordered box in another, and on the overview a
 * `<Link>` given `h-10 leading-10` in the hope it would behave like a button,
 * which it does not — an inline anchor has no height to centre inside, so it sat
 * a few pixels off every control beside it.
 *
 * And none of them said anything when pressed. Most of these forms post a
 * server action that returns nothing, so between the click and the page coming
 * back there was no spinner, no disabled state and no change of label. A button
 * that looks identical before and after you press it has, as far as the person
 * pressing it is concerned, not worked — and they press it again.
 *
 * So: `useFormStatus` is read here rather than at every call site. Any button
 * inside a `<form action={…}>` now reports its own round trip without the page
 * around it having to thread a `pending` flag down. Forms that already own the
 * state through `useActionState` pass `pending` explicitly and win.
 *
 * Shape is the system's rule from `globals.css`: everything you read has
 * corners, everything you press does not.
 */

type Variant = "primary" | "quiet" | "danger";
type Size = "sm" | "md";

const VARIANT: Record<Variant, string> = {
  primary: "bg-ink text-bone hover:bg-coral hover:text-ink",
  quiet: "border border-ash text-ink hover:border-ink hover:bg-bone-2",
  /* Reserved for the actions that take something away. Outlined rather than
     filled: a destructive control should be findable, not the loudest thing on
     the page. */
  danger: "border border-coral/50 text-ink hover:border-coral hover:bg-coral/10",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 gap-2 px-3.5 text-[13px]",
  md: "h-10 gap-2 px-4 text-[13px]",
};

const BASE =
  "inline-flex shrink-0 items-center justify-center rounded-full font-sans font-medium " +
  "whitespace-nowrap transition-[color,background-color,border-color,scale] duration-300 " +
  "ease-[var(--ease-out-quint)] active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-45";

/* A waiting button is disabled, but it must not be *dimmed* like one: fading
   the fill to 45% takes the label down with it, and "Saving…" is the one word
   on the page somebody is actually reading at that moment. It keeps its colour
   and stops taking presses. */
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
export function SubmitButton({
  children,
  ...rest
}: Omit<ComponentProps<typeof Button>, "type">) {
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
