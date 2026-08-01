"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/site/field";
import { login, type LoginState } from "@/app/(admin)/admin/actions";

/**
 * The sign-in form.
 *
 * `useActionState` rather than local state and a fetch: the action is already a
 * server action, and this way the form still submits with JavaScript disabled
 * and the error survives the round trip without a client-side store.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

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
        />
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

      {state.error && (
        <p role="alert" className="border-l-2 border-coral pl-3 text-sm text-slate">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-sheet bg-ink text-[14px] font-medium text-bone transition-colors hover:bg-coral hover:text-ink disabled:pointer-events-none disabled:opacity-40"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
