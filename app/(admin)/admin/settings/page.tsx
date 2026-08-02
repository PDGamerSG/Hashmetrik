import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { SETTINGS, readSettings } from "@/lib/settings/store";
import { listAudit } from "@/lib/audit";
import { saveSettings } from "./actions";
import { Field, Input } from "@/components/site/field";
import {
  Card,
  Empty,
  PageHeader,
  SectionTitle,
  SubmitButton,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const [values, trail] = await Promise.all([readSettings(), listAudit(60)]);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        meta="Values an administrator can change without a deploy"
      />

      <Card className="mt-8">
        <SectionTitle>Company</SectionTitle>
        {/* One form for the lot: these are read together and changed together,
            and five separate Save buttons is five chances to change one and
            walk away from the rest. */}
        <form action={saveSettings} className="mt-4 grid gap-4 sm:grid-cols-2">
          {SETTINGS.map((setting) => (
            <Field
              key={setting.key}
              label={setting.label}
              htmlFor={setting.key}
              hint={setting.hint}
            >
              <Input
                id={setting.key}
                name={setting.key}
                defaultValue={values[setting.key]}
                maxLength={200}
              />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </form>
      </Card>

      <section className="mt-10">
        <SectionTitle count={trail.length}>Audit trail</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Activations, service changes, staff accounts and content edits. Ordinary work — a
          milestone ticked, a caption rewritten — is not logged here, because a trail that records
          everything is one nobody reads.
        </p>

        {trail.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-ash text-left">
                  <th scope="col" className="label-sm py-2 text-slate">When</th>
                  <th scope="col" className="label-sm py-2 text-slate">Who</th>
                  <th scope="col" className="label-sm py-2 text-slate">Action</th>
                  <th scope="col" className="label-sm py-2 text-slate">Entity</th>
                </tr>
              </thead>
              <tbody>
                {trail.map((entry) => (
                  <tr key={entry.id} className="border-b border-ash/60">
                    <td className="tabular py-2 text-slate">{formatDateTime(entry.createdAt)}</td>
                    <td className="py-2 text-ink">
                      {entry.actor?.name ?? entry.actor?.email ?? "—"}
                    </td>
                    <td className="py-2 text-ink">{entry.action}</td>
                    <td className="py-2 text-slate">{entry.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
