import type { Metadata } from "next";
import { Check as CheckMark } from "lucide-react";
import { requireTeamMember } from "@/lib/auth/dal";
import { listAllProjects, listProjectsForManager, PROJECT_STATUSES } from "@/lib/projects/store";
import { listClients, listClientsForManager, listServices } from "@/lib/clients/store";
import { NewDeliverableForm, NewProjectForm, ReplyForm } from "@/components/app/team-forms";
import { safeUrl } from "@/lib/url";
import { flipMilestone, newMilestone, saveProject, sendForApproval } from "../actions";
import { Field, Input as FieldInput } from "@/components/site/field";
import {
  Card,
  Empty,
  Input,
  Meter,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Select,
  SubmitButton,
  formatDate,
  type Tone,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

const TONE: Record<string, Tone> = {
  draft: "neutral",
  submitted: "live",
  approved: "good",
  changes_requested: "warn",
};

export default async function TeamProjectsPage() {
  const { viewer, member } = await requireTeamMember();
  const scope = viewer.role === "ADMIN" ? undefined : member?.id;

  const [projects, clients, services] = await Promise.all([
    scope ? listProjectsForManager(scope) : listAllProjects(),
    scope ? listClientsForManager(scope) : listClients(),
    listServices(),
  ]);

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: c.companyName ?? c.user.name ?? c.user.email,
  }));

  const projectOptions = projects.map((p) => ({
    id: p.id,
    name: `${p.client.companyName ?? "Client"} — ${p.name}`,
  }));

  const deliverables = projects.flatMap((p) => p.deliverables);
  const withClient = deliverables.filter((d) => d.status === "submitted").length;
  const sentBack = deliverables.filter((d) => d.status === "changes_requested").length;
  const drafts = deliverables.filter((d) => d.status === "draft").length;

  return (
    <>
      <PageHeader
        title="Projects"
        meta={`${projects.length} open across ${clientOptions.length} account${clientOptions.length === 1 ? "" : "s"}`}
      />

      <Readouts>
        <Readout
          label="Sent back"
          value={sentBack}
          note="A client asked for changes"
          urgent
        />
        <Readout label="With the client" value={withClient} note="Waiting on an approval" />
        <Readout label="Drafts" value={drafts} note="Not yet sent for approval" />
        <Readout label="Deliverables" value={deliverables.length} note="Across every project" />
      </Readouts>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <NewProjectForm
          clients={clientOptions}
          services={services.map((s) => ({ id: s.id, name: s.name }))}
        />
        <NewDeliverableForm projects={projectOptions} />
      </div>

      {projects.length === 0 ? (
        <Empty>No projects yet. Create one above once a client has a service assigned.</Empty>
      ) : (
        <ul className="mt-8 space-y-6">
          {projects.map((project) => {
            const done = project.milestones.filter((m) => m.completed).length;

            return (
              <Card as="li" key={project.id}>
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-xl leading-tight font-medium text-ink">
                      {project.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate">
                      {project.client.companyName ?? "Client"} · {project.service.name}
                    </p>
                  </div>

                  {/* Status and progress are one form: they are changed together
                      in practice, and two buttons a centimetre apart is how a
                      progress bar ends up out of step with the status. */}
                  <form action={saveProject} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={project.id} />
                    <Select
                      id={`status-${project.id}`}
                      name="status"
                      label="Status"
                      hideLabel
                      defaultValue={project.status}
                      className="w-36"
                    >
                      {PROJECT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                    <Input
                      id={`progress-${project.id}`}
                      name="progress"
                      label="Progress"
                      hideLabel
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={String(project.progress)}
                      className="w-20"
                    />
                    <SubmitButton busyLabel="Saving…">Save</SubmitButton>
                  </form>
                </div>

                <div className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
                  <Meter
                    label="Progress"
                    value={project.progress}
                    display={`${project.progress}%`}
                  />
                  {project.milestones.length > 0 && (
                    <Meter
                      label="Milestones"
                      value={done}
                      max={project.milestones.length}
                      display={`${done} of ${project.milestones.length}`}
                    />
                  )}
                </div>

                <section className="mt-6 border-t border-ash pt-5">
                  <div className="flex items-center gap-4">
                    <h4 className="label-xs shrink-0 text-slate">Milestones</h4>
                    <span aria-hidden className="h-px flex-1 bg-ash" />
                    <span className="tabular label-xs text-ink">{project.milestones.length}</span>
                  </div>

                  {project.milestones.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {project.milestones.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center gap-3 text-sm">
                          <form action={flipMilestone} className="flex">
                            <input type="hidden" name="id" value={m.id} />
                            <input type="hidden" name="completed" value={String(!m.completed)} />
                            <button
                              type="submit"
                              aria-pressed={m.completed}
                              className={`flex size-4.5 items-center justify-center rounded-full border transition-colors ${
                                m.completed
                                  ? "border-ink bg-ink text-bone"
                                  : "border-ash text-transparent hover:border-ink"
                              }`}
                            >
                              <CheckMark aria-hidden className="size-3" strokeWidth={2.5} />
                              <span className="sr-only">
                                {m.completed ? "Mark not done" : "Mark done"}: {m.title}
                              </span>
                            </button>
                          </form>
                          <span className={m.completed ? "text-slate line-through" : "text-ink"}>
                            {m.title}
                          </span>
                          {m.dueDate && (
                            <span className="tabular ml-auto text-xs text-slate">
                              {formatDate(m.dueDate)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <form action={newMilestone} className="mt-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="projectId" value={project.id} />
                    <Field
                      label="New milestone"
                      htmlFor={`ms-${project.id}`}
                      className="min-w-56 flex-1"
                    >
                      <FieldInput id={`ms-${project.id}`} name="title" required maxLength={160} />
                    </Field>
                    <Field label="Due" htmlFor={`msd-${project.id}`}>
                      <FieldInput id={`msd-${project.id}`} name="dueDate" type="date" />
                    </Field>
                    <SubmitButton variant="quiet" busyLabel="Adding…">
                      Add
                    </SubmitButton>
                  </form>
                </section>

                <section className="mt-6 border-t border-ash pt-5">
                  <div className="flex items-center gap-4">
                    <h4 className="label-xs shrink-0 text-slate">Deliverables</h4>
                    <span aria-hidden className="h-px flex-1 bg-ash" />
                    <span className="tabular label-xs text-ink">
                      {project.deliverables.length}
                    </span>
                  </div>

                  {project.deliverables.length === 0 ? (
                    <Empty>Nothing yet. Send the first file up for approval above.</Empty>
                  ) : (
                    /* Ruled rows rather than boxes inside a box: the card is
                       already the project, and a border around each file was a
                       second frame saying the same thing. */
                    <ul className="mt-2 divide-y divide-ash">
                      {project.deliverables.map((d) => (
                        <li key={d.id} className="py-5 first:pt-4 last:pb-0">
                          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                            <div className="min-w-0">
                              <p className="text-[15px] leading-snug font-medium text-ink">
                                {d.title}
                              </p>
                              <p className="label-xs mt-1.5 text-slate">
                                {d.type.replace("_", " ")} ·{" "}
                                <span className="tabular">{formatDate(d.createdAt)}</span>
                              </p>
                              {safeUrl(d.fileUrl) ? (
                                <a
                                  href={safeUrl(d.fileUrl) as string}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2.5 inline-block text-sm text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
                                >
                                  Open the file
                                </a>
                              ) : (
                                <p className="mt-2.5 text-sm text-slate">
                                  That link is not http or https, so it is not rendered.
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Pill tone={TONE[d.status] ?? "neutral"} dot>
                                {d.status.replace("_", " ")}
                              </Pill>
                              {d.status !== "submitted" && (
                                <form action={sendForApproval}>
                                  <input type="hidden" name="id" value={d.id} />
                                  <SubmitButton variant="quiet" size="sm" busyLabel="Sending…">
                                    {d.status === "draft" ? "Send for approval" : "Resubmit"}
                                  </SubmitButton>
                                </form>
                              )}
                            </div>
                          </div>

                          {d.comments.length > 0 && (
                            <ul className="mt-4 space-y-3 border-l border-ash pl-4">
                              {d.comments.map((c) => (
                                <li key={c.id} className="text-sm">
                                  <p className="label-xs text-slate">
                                    {c.author.name ?? c.author.email}
                                    {c.author.role === "REGISTERED_USER" && " · client"} ·{" "}
                                    <span className="tabular">{formatDate(c.createdAt)}</span>
                                  </p>
                                  <p className="mt-1.5 leading-relaxed text-ink">{c.body}</p>
                                </li>
                              ))}
                            </ul>
                          )}

                          <div className="mt-4">
                            <ReplyForm deliverableId={d.id} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </Card>
            );
          })}
        </ul>
      )}
    </>
  );
}
