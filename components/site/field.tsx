import type { ComponentProps, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/* Focus darkens the edge rather than colouring it. Coral is now what an error
   is drawn in — see `Notice` — and a field that turns red the moment you reach
   it says the opposite of what it means. Keyboard focus is still marked in the
   brand colour by the one `:focus-visible` outline in `globals.css`, which sits
   outside the border and cannot be mistaken for the field's own state. */
const CONTROL =
  "h-12 w-full rounded-sheet border border-ash bg-bone-2 px-3.5 text-base text-ink " +
  "transition-colors placeholder:text-slate/60 hover:border-ink/40 focus:border-ink focus:outline-none";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="label-sm text-slate"
      >
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 text-xs text-slate">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL, "appearance-none pr-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "h-auto py-3 leading-relaxed", className)} {...props} />;
}

/**
 * What a form says when it could not do the thing.
 *
 * Set as a bounded notice rather than the bare coral rule this used to be: a
 * two-pixel edge with text beside it is the same shape as a pull quote, and an
 * error that arrives silently under a password field is the one message on the
 * page that has to be impossible to miss. The tint and the mark carry it; the
 * words carry it too, so nothing here depends on seeing the colour.
 */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2.5 rounded-sheet border border-coral/45 bg-coral/10 px-3.5 py-3 text-sm leading-relaxed text-ink"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-coral" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}
