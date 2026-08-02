"use client";

import { useActionState, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/site/field";
import { Alert } from "@/components/app/ui";
import { Button, SubmitButton } from "@/components/app/button";
import {
  activateUser,
  addAccount,
  changeRole,
  editAccount,
  resetPassword,
  toggleSuspension,
  type ActionState,
} from "@/app/(admin)/admin/actions";
import { saveContent, type ContentState } from "@/app/(admin)/admin/cms/actions";

type Option = { id: string; name: string };

function Result({ state }: { state: { error?: string; ok?: string } }) {
  if (state.error) return <Alert>{state.error}</Alert>;
  if (state.ok) return <Alert tone="good">{state.ok}</Alert>;
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
      <Button type="button" onClick={() => setOpen(true)}>
        Make a client
      </Button>
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
        <SubmitButton pending={pending} busyLabel="Activating…">Activate</SubmitButton>
        <Button type="button" variant="quiet" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Result state={state} />
      </div>
    </form>
  );
}

/**
 * Creating an account by hand.
 *
 * One form for all three roles, with the role list narrowed by the page that
 * renders it: `/admin/team` offers staff only, `/admin/users` offers everything.
 * The job title appears only when a team member is being created, because a
 * field that does nothing for the option you picked reads as a field you forgot
 * to fill in.
 */
const ROLE_LABELS: Record<string, string> = {
  REGISTERED_USER: "Registered user",
  TEAM_MEMBER: "Team member",
  ADMIN: "Administrator",
};

export function AccountForm({
  roles = ["REGISTERED_USER", "TEAM_MEMBER", "ADMIN"],
  defaultRole = "TEAM_MEMBER",
  idPrefix = "new",
}: {
  roles?: readonly string[];
  defaultRole?: string;
  idPrefix?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(addAccount, {});
  const [role, setRole] = useState(defaultRole);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Field label="Name" htmlFor={`${idPrefix}-name`}>
        <Input id={`${idPrefix}-name`} name="name" required maxLength={100} />
      </Field>

      <Field label="Email" htmlFor={`${idPrefix}-email`}>
        <Input id={`${idPrefix}-email`} name="email" type="email" required maxLength={255} />
      </Field>

      <Field
        label="Password"
        htmlFor={`${idPrefix}-password`}
        hint="At least 12 characters. Send it to them by a channel that isn't email."
      >
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type="password"
          required
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </Field>

      <Field label="Role" htmlFor={`${idPrefix}-role`}>
        <Select
          id={`${idPrefix}-role`}
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r] ?? r}
            </option>
          ))}
        </Select>
      </Field>

      {role === "TEAM_MEMBER" ? (
        <Field label="Job title" htmlFor={`${idPrefix}-title`} className="sm:col-span-2">
          <Input
            id={`${idPrefix}-title`}
            name="roleTitle"
            maxLength={80}
            placeholder="Account manager"
          />
        </Field>
      ) : (
        <>
          <Field label="Phone" htmlFor={`${idPrefix}-phone`}>
            <Input id={`${idPrefix}-phone`} name="phone" type="tel" maxLength={20} />
          </Field>
          <Field label="Business" htmlFor={`${idPrefix}-business`}>
            <Input id={`${idPrefix}-business`} name="businessName" maxLength={120} />
          </Field>
        </>
      )}

      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton pending={pending} busyLabel="Creating…">Create account</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}

/** The narrower form `/admin/team` has always shown. */
export function StaffForm() {
  return (
    <AccountForm roles={["TEAM_MEMBER", "ADMIN"]} defaultRole="TEAM_MEMBER" idPrefix="staff" />
  );
}

/**
 * Everything an administrator can do to one account, behind one disclosure.
 *
 * Collapsed by default and deliberately so: these are the destructive controls,
 * and a directory that shows a "Suspend" button on every row invites the mis-click
 * that a confirmation dialog then has to defend against. Opening it is the
 * confirmation.
 */
export function ManageAccount({
  user,
  isSelf,
}: {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone: string | null;
    businessName: string | null;
    businessType: string | null;
    suspended: boolean;
  };
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="quiet" onClick={() => setOpen(true)}>
        Manage
      </Button>
    );
  }

  return (
    <div className="mt-4 w-full space-y-6 border-t border-ash pt-4">
      <RoleForm userId={user.id} role={user.role} isSelf={isSelf} />
      <SuspensionForm userId={user.id} suspended={user.suspended} isSelf={isSelf} />
      <EditAccountForm user={user} />
      <PasswordResetForm userId={user.id} />

      <Button type="button" variant="quiet" onClick={() => setOpen(false)}>
        Close
      </Button>
    </div>
  );
}

function RoleForm({ userId, role, isSelf }: { userId: string; role: string; isSelf: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(changeRole, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="userId" value={userId} />
      <Field label="Role" htmlFor={`role-${userId}`}>
        <Select id={`role-${userId}`} name="role" defaultValue={role} disabled={isSelf}>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <SubmitButton pending={pending} busyLabel="Changing…" disabled={isSelf}>
        Change role
      </SubmitButton>
      {isSelf && (
        <p className="text-sm text-slate">
          You cannot change your own role — ask another administrator.
        </p>
      )}
      <Result state={state} />
    </form>
  );
}

function SuspensionForm({
  userId,
  suspended,
  isSelf,
}: {
  userId: string;
  suspended: boolean;
  isSelf: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(toggleSuspension, {});

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="suspend" value={suspended ? "false" : "true"} />
      <SubmitButton
        pending={pending}
        busyLabel={suspended ? "Restoring…" : "Suspending…"}
        variant={suspended ? "primary" : "danger"}
        disabled={isSelf && !suspended}
      >
        {suspended ? "Restore access" : "Suspend account"}
      </SubmitButton>
      <p className="text-sm text-slate">
        {suspended
          ? "They are locked out now. Nothing has been deleted."
          : "Signs them out on their next page load. Nothing is deleted."}
      </p>
      <Result state={state} />
    </form>
  );
}

function EditAccountForm({
  user,
}: {
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    businessName: string | null;
    businessType: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(editAccount, {});

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="userId" value={user.id} />

      <Field label="Name" htmlFor={`name-${user.id}`}>
        <Input id={`name-${user.id}`} name="name" defaultValue={user.name ?? ""} maxLength={100} />
      </Field>
      <Field label="Phone" htmlFor={`phone-${user.id}`}>
        <Input
          id={`phone-${user.id}`}
          name="phone"
          type="tel"
          defaultValue={user.phone ?? ""}
          maxLength={20}
        />
      </Field>
      <Field label="Business" htmlFor={`biz-${user.id}`}>
        <Input
          id={`biz-${user.id}`}
          name="businessName"
          defaultValue={user.businessName ?? ""}
          maxLength={120}
        />
      </Field>
      <Field label="Industry" htmlFor={`ind-${user.id}`}>
        <Input
          id={`ind-${user.id}`}
          name="businessType"
          defaultValue={user.businessType ?? ""}
          maxLength={80}
        />
      </Field>

      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton pending={pending} busyLabel="Saving…" variant="quiet">
          Save details
        </SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}

function PasswordResetForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(resetPassword, {});

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="userId" value={userId} />
      <Field
        label="New password"
        htmlFor={`pw-${userId}`}
        hint="There is no emailed reset link yet. Send this by a channel that isn't email."
      >
        <Input
          id={`pw-${userId}`}
          name="password"
          type="password"
          minLength={12}
          maxLength={72}
          autoComplete="new-password"
        />
      </Field>
      <SubmitButton pending={pending} busyLabel="Setting…" variant="quiet">
        Set password
      </SubmitButton>
      <Result state={state} />
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
        <SubmitButton pending={pending} busyLabel="Saving…">Save</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}
