import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { PLATFORMS, listCalendarForManager } from "@/lib/calendar/store";
import { listClients, listClientsForManager } from "@/lib/clients/store";
import { NewCalendarForm } from "@/components/app/team-forms";
import { editCalendarEntry, removeCalendarEntry } from "../actions";
import { Input, Textarea } from "@/components/site/field";
import {
  Alert,
  Card,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
  SubmitButton,
  formatDate,
  toLocalInput,
  type Tone,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = {
  pending: "live",
  approved: "good",
  changes_requested: "warn",
};

export default async function TeamCalendarPage() {
  const { viewer, member } = await requireTeamMember();
  const scope = viewer.role === "ADMIN" ? undefined : member?.id;

  const [entries, clients] = await Promise.all([
    listCalendarForManager(scope),
    scope ? listClientsForManager(scope) : listClients(),
  ]);

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: c.companyName ?? c.user.name ?? c.user.email,
  }));

  const changes = entries.filter((e) => e.approvalStatus === "changes_requested");

  return (
    <>
      <PageHeader
        title="Content calendar"
        meta={`${entries.length} planned · ${changes.length} needing changes`}
      />

      <div className="mt-6">
        <NewCalendarForm clients={clientOptions} platforms={PLATFORMS} />
      </div>

      {entries.length === 0 ? (
        <Empty>Nothing planned. Add a post above and the client is asked to approve it.</Empty>
      ) : (
        <ul className="mt-8 space-y-4">
          {entries.map((entry) => (
            <Card as="li" key={entry.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label-sm text-slate">
                    {entry.client.companyName ?? "Client"} · {entry.platform} ·{" "}
                    {formatDate(entry.publishDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={TONE[entry.approvalStatus] ?? "neutral"}>
                    {entry.approvalStatus.replace("_", " ")}
                  </Pill>
                  <form action={removeCalendarEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <SubmitButton variant="quiet">Remove</SubmitButton>
                  </form>
                </div>
              </div>

              {entry.note && (
                <div className="mt-3">
                  <Alert>Client asked for: {entry.note}</Alert>
                </div>
              )}

              {/* Editing in place rather than behind a modal: the caption is
                  the thing being discussed, and a change request is answered by
                  rewriting it a line below where it was quoted. Any edit resets
                  the approval — see `updateCalendarEntry`. */}
              <form action={editCalendarEntry} className="mt-4 space-y-3 border-t border-ash pt-4">
                <input type="hidden" name="id" value={entry.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`date-${entry.id}`} className="label-sm text-slate">
                      Publish
                    </label>
                    <Input
                      id={`date-${entry.id}`}
                      name="publishDate"
                      type="datetime-local"
                      defaultValue={toLocalInput(entry.publishDate)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label htmlFor={`creative-${entry.id}`} className="label-sm text-slate">
                      Creative link
                    </label>
                    <Input
                      id={`creative-${entry.id}`}
                      name="creativeUrl"
                      type="url"
                      defaultValue={entry.creativeUrl ?? ""}
                      maxLength={500}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={`caption-${entry.id}`} className="label-sm text-slate">
                    Caption
                  </label>
                  <Textarea
                    id={`caption-${entry.id}`}
                    name="caption"
                    rows={3}
                    defaultValue={entry.caption ?? ""}
                    maxLength={2000}
                    className="mt-2"
                  />
                </div>

                <SubmitButton>Save and resend for approval</SubmitButton>
              </form>
            </Card>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <SectionTitle>Platforms</SectionTitle>
        <ul className="mt-3 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <li key={p}>
              <Pill>{p}</Pill>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
