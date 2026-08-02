"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./field";
import { cn } from "@/lib/utils";

/**
 * A password field you can read back.
 *
 * The one control on these forms where a typo is invisible and the only
 * feedback is a rejection several seconds later. The toggle is a button rather
 * than a checkbox so it never submits with the form, and it is inside the
 * field's own right-hand padding rather than beside it, so the row keeps the
 * same width as every other field on the page.
 *
 * `type` is owned here and cannot be passed in — the whole point is that this
 * component decides it.
 */
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input type={shown ? "text" : "password"} className={cn("pr-12", className)} {...props} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-pressed={shown}
        /* `-inset-y-px … right-px` keeps the hit area inside the field's own
           border, so the focus ring outlines the button rather than sitting on
           top of the input's edge. */
        className="absolute inset-y-px right-px grid w-11 place-items-center rounded-sheet text-slate transition-colors hover:text-ink"
      >
        <span className="sr-only">{shown ? "Hide password" : "Show password"}</span>
        <Icon aria-hidden className="size-4" />
      </button>
    </div>
  );
}
