"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/app/button";
import { Field, Input, Notice } from "@/components/site/field";
import { PasswordInput } from "@/components/site/password-input";
import { login, signup, type FormState } from "@/app/(app)/actions";
import { MIN_PASSWORD } from "@/lib/accounts/schema";

/**
 * The two public account forms.
 *
 * `useActionState` rather than local state and a fetch: the actions are already
 * server actions, so the forms still submit with JavaScript disabled and the
 * error survives the round trip without a client-side store.
 *
 * The submit is the board's own key, not the marketing site's pill: these two
 * forms are the door into the board and everything behind them is machined.
 * Taller than a key inside the app and full width, because it is the only thing
 * on the page to press and a stack of dark slots wants a lit face under it.
 */

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" pending={pending} className="h-12 w-full">
      {children}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          maxLength={255}
          placeholder="you@company.com"
        />
      </Field>

      <Field label="Password" htmlFor="password">
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="current-password"
          maxLength={200}
        />
      </Field>

      {state.error && <Notice>{state.error}</Notice>}

      <Submit pending={pending}>{pending ? "Signing in…" : "Sign in"}</Submit>

      <p className="text-sm text-slate">
        No account?{" "}
        <Link
          href="/signup"
          className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
        >
          Create one
        </Link>
        .
      </p>
    </form>
  );
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(signup, {});

  return (
    /* One column until `sm`. The two-column grid used to apply at every width,
       so Business and Industry sat side by side as a pair of 150px boxes on a
       phone — which is where most of this traffic lands. */
    <form action={formAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Name" htmlFor="name" className="sm:col-span-2">
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          autoFocus
          maxLength={100}
          placeholder="Your full name"
        />
      </Field>

      <Field label="Email" htmlFor="email" className="sm:col-span-2">
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          maxLength={255}
          placeholder="you@company.com"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        className="sm:col-span-2"
        hint={`At least ${MIN_PASSWORD} characters. A short phrase beats a clever word.`}
      >
        <PasswordInput
          id="password"
          name="password"
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          maxLength={72}
        />
      </Field>

      {/* The required half ends here. Ruled off rather than merely spaced,
          because the three fields below it are the only ones on the page a
          visitor may skip and nothing else on the form says so. */}
      <div className="mt-3 border-t border-ash pt-6 sm:col-span-2">
        <p className="label-sm text-slate">Optional</p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Useful for the first call, and editable later from your account.
        </p>
      </div>

      <Field label="Business" htmlFor="businessName">
        <Input
          id="businessName"
          name="businessName"
          autoComplete="organization"
          maxLength={120}
          placeholder="Company name"
        />
      </Field>

      <Field label="Industry" htmlFor="businessType">
        <Input id="businessType" name="businessType" maxLength={80} placeholder="Retail, clinic…" />
      </Field>

      <Field label="Phone" htmlFor="phone" className="sm:col-span-2">
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          placeholder="+91 00000 00000"
        />
      </Field>

      {state.error && (
        <div className="sm:col-span-2">
          <Notice>{state.error}</Notice>
        </div>
      )}

      <div className="sm:col-span-2">
        <Submit pending={pending}>{pending ? "Creating…" : "Create account"}</Submit>
      </div>

      <p className="text-sm text-slate sm:col-span-2">
        Already have one?{" "}
        <Link
          href="/login"
          className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
        >
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
