"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, Input } from "@/components/site/field";
import { login, signup, type FormState } from "@/app/(app)/actions";
import { MIN_PASSWORD } from "@/lib/accounts/schema";

/**
 * The two public account forms.
 *
 * `useActionState` rather than local state and a fetch: the actions are already
 * server actions, so the forms still submit with JavaScript disabled and the
 * error survives the round trip without a client-side store.
 */

function Submit({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-sheet bg-ink text-[14px] font-medium text-bone transition-colors hover:bg-coral hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Problem({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-l-2 border-coral pl-3 text-sm text-slate">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={formAction} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" required autoComplete="username" autoFocus maxLength={255} />
      </Field>

      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={200}
        />
      </Field>

      <Problem message={state.error} />
      <Submit pending={pending}>{pending ? "Signing in…" : "Sign in"}</Submit>

      <p className="text-sm text-slate">
        No account?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-2">
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
    <form action={formAction} className="grid grid-cols-2 gap-4">
      <Field label="Name" htmlFor="name" className="col-span-2">
        <Input id="name" name="name" required autoComplete="name" autoFocus maxLength={100} />
      </Field>

      <Field label="Email" htmlFor="email" className="col-span-2">
        <Input id="email" name="email" type="email" required autoComplete="username" maxLength={255} />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        className="col-span-2"
        hint={`At least ${MIN_PASSWORD} characters. A short phrase beats a clever word.`}
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          maxLength={72}
        />
      </Field>

      <Field label="Business" htmlFor="businessName">
        <Input id="businessName" name="businessName" autoComplete="organization" maxLength={120} />
      </Field>

      <Field label="Industry" htmlFor="businessType">
        <Input id="businessType" name="businessType" maxLength={80} />
      </Field>

      <Field label="Phone" htmlFor="phone" className="col-span-2">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={20} />
      </Field>

      {state.error && (
        <div className="col-span-2">
          <Problem message={state.error} />
        </div>
      )}

      <div className="col-span-2">
        <Submit pending={pending}>{pending ? "Creating…" : "Create account"}</Submit>
      </div>

      <p className="col-span-2 text-sm text-slate">
        Already have one?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
