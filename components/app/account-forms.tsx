"use client";

import { useActionState } from "react";
import { Field, Input, Textarea } from "@/components/site/field";
import { Alert } from "@/components/app/ui";
import { SubmitButton } from "@/components/app/button";
import { askForConsultation, type FormState } from "@/app/(app)/dashboard/actions";
import { saveProfile, type FormState as ProfileState } from "@/app/(app)/actions";

/**
 * The two forms a registered user fills in for themselves.
 *
 * Client components only because `useActionState` needs to be — the actions
 * they post to are server actions, so both still work without JavaScript, and
 * neither holds any state of its own beyond what the round trip returns.
 */

function Result({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error) return <Alert>{state.error}</Alert>;
  if (state.ok) return <Alert tone="good">{state.ok}</Alert>;
  return null;
}

export function ConsultationRequest() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    askForConsultation,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field label="What would you like to talk about?" htmlFor="topic">
        <Input id="topic" name="topic" required maxLength={120} placeholder="Performance marketing" />
      </Field>

      <Field label="Anything we should read first?" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} maxLength={2000} />
      </Field>

      <Result state={state} />
      <SubmitButton pending={pending} busyLabel="Sending…">Request a call</SubmitButton>
    </form>
  );
}

export function ProfileForm({
  defaults,
  email,
}: {
  defaults: { name: string; phone: string; businessName: string; businessType: string };
  email: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(saveProfile, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor="profile-name">
        <Input id="profile-name" name="name" defaultValue={defaults.name} required maxLength={100} />
      </Field>

      {/* Read-only rather than absent: it is the thing people check, and it is
          also what they sign in with, so hiding it invites a support email.
          Changing it is a different job — it moves the account. */}
      <Field label="Email" htmlFor="profile-email" hint="Contact us to change this.">
        <Input id="profile-email" defaultValue={email} readOnly disabled />
      </Field>

      <Field label="Phone" htmlFor="profile-phone">
        <Input id="profile-phone" name="phone" type="tel" defaultValue={defaults.phone} maxLength={20} />
      </Field>

      <Field label="Business" htmlFor="profile-business">
        <Input
          id="profile-business"
          name="businessName"
          defaultValue={defaults.businessName}
          maxLength={120}
        />
      </Field>

      <Field label="Industry" htmlFor="profile-industry" className="sm:col-span-2">
        <Input
          id="profile-industry"
          name="businessType"
          defaultValue={defaults.businessType}
          maxLength={80}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <SubmitButton pending={pending} busyLabel="Saving…">Save</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}
