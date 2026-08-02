"use client";

import { useActionState, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/site/field";
import { SubmitButton } from "@/components/app/ui";
import {
  newCalendarEntry,
  newDeliverable,
  newProject,
  recordKpi,
  replyToClient,
  type FormState,
} from "@/app/(app)/team/actions";

/**
 * The forms staff use to put work in front of a client.
 *
 * Each one is a disclosure rather than a permanently open panel: these pages
 * are read far more often than they are written to, and four open forms above
 * the list is four screens of scrolling before the actual work.
 */

type Option = { id: string; name: string };

function Result({ state }: { state: FormState }) {
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

function Disclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="h-10 rounded-sheet border border-ash px-4 text-[13px] text-ink transition-colors hover:border-ink hover:bg-bone-2"
      >
        {open ? "Close" : label}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function NewProjectForm({
  clients,
  services,
}: {
  clients: Option[];
  services: Option[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(newProject, {});

  return (
    <Disclosure label="New project">
      <form action={formAction} className="grid grid-cols-2 gap-4">
        <Field label="Client" htmlFor="np-client">
          <Select id="np-client" name="clientId" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Service" htmlFor="np-service">
          <Select id="np-service" name="serviceId" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Name" htmlFor="np-name" className="col-span-2">
          <Input id="np-name" name="name" required maxLength={120} placeholder="Q3 always-on social" />
        </Field>

        <Field label="Starts" htmlFor="np-start">
          <Input id="np-start" name="startDate" type="date" />
        </Field>

        <Field label="Target end" htmlFor="np-end">
          <Input id="np-end" name="endDate" type="date" />
        </Field>

        <div className="col-span-2 flex items-center gap-4">
          <SubmitButton pending={pending}>{pending ? "Creating…" : "Create project"}</SubmitButton>
          <Result state={state} />
        </div>
      </form>
    </Disclosure>
  );
}

export function NewDeliverableForm({ projects }: { projects: Option[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(newDeliverable, {});

  return (
    <Disclosure label="Add a deliverable">
      <form action={formAction} className="grid grid-cols-2 gap-4">
        <Field label="Project" htmlFor="nd-project" className="col-span-2">
          <Select id="nd-project" name="projectId" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="nd-title">
          <Input id="nd-title" name="title" required maxLength={160} />
        </Field>

        <Field label="Type" htmlFor="nd-type">
          <Select id="nd-type" name="type" defaultValue="poster">
            {["poster", "reel", "blog", "report", "source_file", "other"].map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Link to the file"
          htmlFor="nd-url"
          className="col-span-2"
          hint="Drive, Dropbox, Figma — anywhere the client can open it."
        >
          <Input id="nd-url" name="fileUrl" type="url" required maxLength={500} placeholder="https://" />
        </Field>

        <div className="col-span-2 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="submit" value="true" defaultChecked className="size-4" />
            Send for approval now
          </label>
          <SubmitButton pending={pending}>{pending ? "Saving…" : "Add"}</SubmitButton>
          <Result state={state} />
        </div>
      </form>
    </Disclosure>
  );
}

export function ReplyForm({ deliverableId }: { deliverableId: string }) {
  return (
    <form action={replyToClient} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={deliverableId} />
      <label htmlFor={`reply-${deliverableId}`} className="label-sm text-slate">
        Reply
      </label>
      <Textarea id={`reply-${deliverableId}`} name="body" rows={2} maxLength={2000} />
      <SubmitButton variant="quiet">Post</SubmitButton>
    </form>
  );
}

export function NewCalendarForm({
  clients,
  platforms,
}: {
  clients: Option[];
  platforms: readonly string[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(newCalendarEntry, {});

  return (
    <Disclosure label="Plan a post">
      <form action={formAction} className="grid grid-cols-2 gap-4">
        <Field label="Client" htmlFor="nc-client">
          <Select id="nc-client" name="clientId" required defaultValue="">
            <option value="" disabled>
              Choose…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Platform" htmlFor="nc-platform">
          <Select id="nc-platform" name="platform" required defaultValue={platforms[0]}>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Publish date" htmlFor="nc-date" className="col-span-2">
          <Input id="nc-date" name="publishDate" type="datetime-local" required />
        </Field>

        <Field label="Caption" htmlFor="nc-caption" className="col-span-2">
          <Textarea id="nc-caption" name="caption" rows={3} maxLength={2000} />
        </Field>

        <Field label="Creative link" htmlFor="nc-creative" className="col-span-2">
          <Input id="nc-creative" name="creativeUrl" type="url" maxLength={500} placeholder="https://" />
        </Field>

        <div className="col-span-2 flex items-center gap-4">
          <SubmitButton pending={pending}>{pending ? "Adding…" : "Add to calendar"}</SubmitButton>
          <Result state={state} />
        </div>
      </form>
    </Disclosure>
  );
}

export function KpiForm({
  clients,
  services,
  period,
}: {
  clients: Option[];
  services: Option[];
  period: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(recordKpi, {});

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 lg:grid-cols-6">
      <Field label="Client" htmlFor="kpi-client" className="col-span-2">
        <Select id="kpi-client" name="clientId" required defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Service" htmlFor="kpi-service" className="col-span-2">
        <Select id="kpi-service" name="serviceId" defaultValue="">
          <option value="">Overall</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Period" htmlFor="kpi-period" className="col-span-2">
        <Input id="kpi-period" name="period" required defaultValue={period} pattern="\d{4}-\d{2}" />
      </Field>

      <Field label="Metric" htmlFor="kpi-metric" className="col-span-2">
        <Input id="kpi-metric" name="metricName" required maxLength={80} placeholder="Impressions" />
      </Field>

      <Field label="Value" htmlFor="kpi-value">
        <Input id="kpi-value" name="value" type="number" step="any" required />
      </Field>

      <Field label="Unit" htmlFor="kpi-unit">
        <Input id="kpi-unit" name="unit" maxLength={20} placeholder="₹, %, —" />
      </Field>

      <div className="col-span-2 flex items-center gap-4 lg:col-span-6">
        <SubmitButton pending={pending}>{pending ? "Saving…" : "Record"}</SubmitButton>
        <Result state={state} />
      </div>
    </form>
  );
}
