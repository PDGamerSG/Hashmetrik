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
  Fieldset,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Section,
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
        meta={
          changes.length > 0
            ? `${changes.length} post${changes.length === 1 ? "" : "s"} came back for changes.`
            : "Nothing is waiting on a rewrite."
        }
      />

      <Readouts className="lg:grid-cols-3">
        <Readout label="Needing changes" value={changes.length} note="A client wrote a note" urgent />
        <Readout
          label="Awaiting approval"
          value={entries.filter((e) => e.approvalStatus === "pending").length}
          note="Sitting with the client"
        />
        <Readout label="Planned" value={entries.length} note="Across your accounts" />
      </Readouts>

      <div className="mt-6">
        <NewCalendarForm clients={clientOptions} platforms={PLATFORMS} />
      </div>

      {entries.length === 0 ? (
        <Empty>Nothing planned. Add a post above and the client is asked to approve it.</Empty>
      ) : (
        <ul className="mt-8 space-y-4">
          {entries.map((entry) => (
            <Card as="li" key={entry.id} className="transition-colors hover:border-ink/25">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight font-medium text-ink">
                    {entry.client.companyName ?? "Client"}
                  </p>
                  <p className="label-xs mt-1.5 text-slate">
                    {entry.platform} ·{" "}
                    <span className="tabular">{formatDate(entry.publishDate)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={TONE[entry.approvalStatus] ?? "neutral"} dot>
                    {entry.approvalStatus.replace("_", " ")}
                  </Pill>
                  <form action={removeCalendarEntry}>
                    <input type="hidden" name="id" value={entry.id} />
                    <SubmitButton variant="danger" size="sm" busyLabel="Removing…">
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </div>

              {entry.note && (
                <div className="mt-4">
                  <Alert>Client asked for: {entry.note}</Alert>
                </div>
              )}

              {/* Editing in place rather than behind a modal: the caption is
                  the thing being discussed, and a change request is answered by
                  rewriting it a line below where it was quoted. Any edit resets
                  the approval — see `updateCalendarEntry`. */}
              <form action={editCalendarEntry}>
                <input type="hidden" name="id" value={entry.id} />
                <Fieldset legend="The post">
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`date-${entry.id}`} className="label-xs block text-slate">
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
                      <label htmlFor={`creative-${entry.id}`} className="label-xs block text-slate">
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

                  <div className="mt-4">
                    <label htmlFor={`caption-${entry.id}`} className="label-xs block text-slate">
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

                  <div className="mt-4">
                    <SubmitButton busyLabel="Saving…">Save and resend for approval</SubmitButton>
                  </div>
                </Fieldset>
              </form>
            </Card>
          ))}
        </ul>
      )}

      <Section title="Platforms">
        <ul className="mt-5 flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <li key={p}>
              <Pill>{p}</Pill>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
