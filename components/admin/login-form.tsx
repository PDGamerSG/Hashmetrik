"use client";

import { useActionState } from "react";
import { ActionButton } from "@/components/site/button";
import { Field, Input, Notice } from "@/components/site/field";
import { PasswordInput } from "@/components/site/password-input";
import { login, type LoginState } from "@/app/(admin)/admin/actions";

/**
 * The staff sign-in form.
 *
 * `useActionState` rather than local state and a fetch: the action is already a
 * server action, and this way the form still submits with JavaScript disabled
 * and the error survives the round trip without a client-side store.
 *
 * Deliberately the same controls as the client form. This is the one page where
 * a member of staff and a customer see the same company, and a second set of
 * inputs drawn slightly differently would be the seam between them.
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
          placeholder="you@hashmetrik.in"
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

      <ActionButton type="submit" size="lg" arrow={false} disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </ActionButton>
    </form>
  );
}
