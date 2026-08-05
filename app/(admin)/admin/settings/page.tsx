import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { readSettings, settingsIn } from "@/lib/settings/store";
import { listAudit } from "@/lib/audit";
import { saveSettings } from "./actions";
import { Field, Input, Textarea } from "@/components/site/field";
import { ROLE_POWERS } from "@/lib/auth/permissions";
import {
  Card,
  Empty,
  PageHeader,
  Section,
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
        title="Settings"
        meta="Values an administrator can change without a deploy"
      />

      <Card className="mt-8">
        <SectionTitle>Company</SectionTitle>
        {/* One form for the lot: these are read together and changed together,
            and five separate Save buttons is five chances to change one and
            walk away from the rest. */}
        <form action={saveSettings} className="mt-4 grid gap-4 sm:grid-cols-2">
          {settingsIn("company").map((setting) => (
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
                maxLength={setting.max}
              />
            </Field>
          ))}
          <div className="sm:col-span-2">
            <SubmitButton>Save settings</SubmitButton>
          </div>
        </form>
      </Card>

      <Card className="mt-6">
        <SectionTitle>Notifications and email</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          The wording the platform sends out. Transactional email beyond the team&rsquo;s lead
          notification is not built yet — everything else reaches people as an in-app
          notification, which is why these read as sentences rather than templates with
          placeholders in them.
        </p>
        <form action={saveSettings} className="mt-4 grid gap-4">
          {settingsIn("email").map((setting) => (
            <Field
              key={setting.key}
              label={setting.label}
              htmlFor={setting.key}
              hint={setting.hint}
            >
              {setting.multiline ? (
                <Textarea
                  id={setting.key}
                  name={setting.key}
                  rows={3}
                  defaultValue={values[setting.key]}
                  maxLength={setting.max}
                />
              ) : (
                <Input
                  id={setting.key}
                  name={setting.key}
                  defaultValue={values[setting.key]}
                  maxLength={setting.max}
                />
              )}
            </Field>
          ))}
          <div>
            <SubmitButton>Save wording</SubmitButton>
          </div>
        </form>
      </Card>

      <Section title="Roles and permissions" count={ROLE_POWERS.length}>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate">
          Read-only, and deliberately: permissions here are code, not configuration. Every gated
          page and every server action calls one of the guards in{" "}
          <code className="text-ink">lib/auth/dal.ts</code> against the live database row, so a
          role change takes effect on somebody&rsquo;s next page load. A settings screen that
          could rewrite this table would be a settings screen that can grant itself anything.
          Roles are changed per account on the Accounts page.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-y border-ash text-left">
                <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Role</th>
                <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Can</th>
                <th scope="col" className="label-xs py-2.5 text-slate">Cannot</th>
              </tr>
            </thead>
            <tbody>
              {ROLE_POWERS.map((row) => (
                <tr
                  /* Keyed by label, not role: a client is an activated
                     registered user, so two rows share `REGISTERED_USER` and
                     React was being handed the same key twice. */
                  key={row.label}
                  className="border-b border-ash align-top transition-colors hover:bg-ink/[0.02]"
                >
                  <td className="py-3.5 pr-4 font-medium text-ink">{row.label}</td>
                  <td className="py-3.5 pr-4 text-slate">
                    <ul className="space-y-1.5">
                      {row.can.map((line) => (
                        <li key={line} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ink" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3.5 text-slate">
                    <ul className="space-y-1.5">
                      {row.cannot.map((line) => (
                        <li key={line} className="flex gap-2.5">
                          <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-ash" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Audit trail" count={trail.length}>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate">
          Activations, service changes, staff accounts and content edits. Ordinary work — a
          milestone ticked, a caption rewritten — is not logged here, because a trail that records
          everything is one nobody reads.
        </p>

        {trail.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-y border-ash text-left">
                  <th scope="col" className="label-xs py-2.5 pr-4 text-slate">When</th>
                  <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Who</th>
                  <th scope="col" className="label-xs py-2.5 pr-4 text-slate">Action</th>
                  <th scope="col" className="label-xs py-2.5 text-slate">Entity</th>
                </tr>
              </thead>
              <tbody>
                {trail.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-ash transition-colors hover:bg-ink/[0.02]"
                  >
                    <td className="tabular py-2.5 pr-4 whitespace-nowrap text-slate">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4 text-ink">
                      {entry.actor?.name ?? entry.actor?.email ?? "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-ink">{entry.action}</td>
                    <td className="py-2.5 text-slate">{entry.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}
