"use client";

import { useActionState, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/site/field";
import { SubmitButton } from "@/components/app/ui";
import {
  activateUser,
  addStaff,
  type ActionState,
} from "@/app/(admin)/admin/actions";
import { saveContent, type ContentState } from "@/app/(admin)/admin/cms/actions";

type Option = { id: string; name: string };

function Result({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error) {
    return (
      <p role="alert" className="border-l-2 border-coral pl-3 text-sm text-ink">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="border-l-2 border-gold pl-3 text-sm text-ink">
        {state.ok}
      </p>
    );
  }
  return null;
}

/**
 * Turning a registered account into a client.
 *
 * Services and an account manager are chosen here rather than afterwards,
 * because an activated client with neither sees an empty dashboard and rings
 * somebody about it. Checkboxes rather than a multi-select: six services is a
 * list you read, not a control you fight.
 */
export function ActivateForm({
  userId,
  services,
  managers,
  defaultCompany,
}: {
  userId: string;
  services: Option[];
  managers: Option[];
  defaultCompany: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(activateUser, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-sheet bg-ink px-4 text-[13px] text-bone transition-colors hover:bg-coral hover:text-ink"
      >
        Make a client
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-4 w-full space-y-4 border-t border-ash pt-4">
      <input type="hidden" name="userId" value={userId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor={`company-${userId}`}>
          <Input
            id={`company-${userId}`}
            name="companyName"
            defaultValue={defaultCompany}
            maxLength={120}
          />
        </Field>

        <Field label="Account manager" htmlFor={`manager-${userId}`}>
          <Select id={`manager-${userId}`} name="accountManagerId" defaultValue="">
            <option value="">Unassigned</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset>
        <legend className="label-sm text-slate">Services</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="serviceIds" value={s.id} className="size-4" />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>{pending ? "Activating…" : "Activate"}</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate underline underline-offset-2"
        >
          Cancel
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

export function StaffForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addStaff, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor="staff-name">
        <Input id="staff-name" name="name" required maxLength={100} />
      </Field>

      <Field label="Email" htmlFor="staff-email">
        <Input id="staff-email" name="email" type="email" required maxLength={255} />
      </Field>

      <Field
        label="Password"
        htmlFor="staff-password"
        hint="At least 12 characters. Send it to them by a channel that isn't email."
      >
        <Input
          id="staff-password"
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Role" htmlFor="staff-role">
        <Select id="staff-role" name="role" defaultValue="TEAM_MEMBER">
          <option value="TEAM_MEMBER">Team member</option>
          <option value="ADMIN">Administrator</option>
        </Select>
      </Field>

      <Field label="Job title" htmlFor="staff-title" className="sm:col-span-2">
        <Input id="staff-title" name="roleTitle" maxLength={80} placeholder="Account manager" />
      </Field>

      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton pending={pending}>{pending ? "Creating…" : "Create account"}</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}

/**
 * The CMS editor.
 *
 * A textarea, not a rich editor: what the public pages render is plain text
 * with paragraph breaks, and a WYSIWYG that produces HTML nobody sanitises is a
 * cross-site scripting hole with a toolbar on it.
 */
export function ContentForm({
  content,
  types,
}: {
  content?: {
    id: string;
    type: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    coverUrl: string | null;
    publishedAt: Date | null;
  };
  types: readonly string[];
}) {
  const [state, formAction, pending] = useActionState<ContentState, FormData>(saveContent, {});
  const key = content?.id ?? "new";

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {content && <input type="hidden" name="id" value={content.id} />}

      <Field label="Type" htmlFor={`type-${key}`}>
        <Select id={`type-${key}`} name="type" defaultValue={content?.type ?? types[0]}>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Slug" htmlFor={`slug-${key}`} hint="Lower case, words joined by hyphens.">
        <Input
          id={`slug-${key}`}
          name="slug"
          defaultValue={content?.slug ?? ""}
          required
          maxLength={120}
          pattern="[a-z0-9\-]+"
        />
      </Field>

      <Field label="Title" htmlFor={`title-${key}`} className="sm:col-span-2">
        <Input id={`title-${key}`} name="title" defaultValue={content?.title ?? ""} required maxLength={160} />
      </Field>

      <Field label="Excerpt" htmlFor={`excerpt-${key}`} className="sm:col-span-2">
        <Textarea
          id={`excerpt-${key}`}
          name="excerpt"
          rows={2}
          defaultValue={content?.excerpt ?? ""}
          maxLength={300}
        />
      </Field>

      <Field label="Body" htmlFor={`body-${key}`} className="sm:col-span-2">
        <Textarea
          id={`body-${key}`}
          name="body"
          rows={10}
          defaultValue={content?.body ?? ""}
          required
          maxLength={20000}
        />
      </Field>

      <Field label="Cover image" htmlFor={`cover-${key}`}>
        <Input
          id={`cover-${key}`}
          name="coverUrl"
          type="url"
          defaultValue={content?.coverUrl ?? ""}
          maxLength={500}
        />
      </Field>

      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="published"
            value="true"
            defaultChecked={Boolean(content?.publishedAt)}
            className="size-4"
          />
          Published
        </label>
      </div>

      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton pending={pending}>{pending ? "Saving…" : "Save"}</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}
