import type { Metadata } from "next";
import { requireTeamMember } from "@/lib/auth/dal";
import { listAllProjects, listProjectsForManager, PROJECT_STATUSES } from "@/lib/projects/store";
import { listClients, listClientsForManager, listServices } from "@/lib/clients/store";
import { NewDeliverableForm, NewProjectForm, ReplyForm } from "@/components/app/team-forms";
import { safeUrl } from "@/lib/url";
import { flipMilestone, newMilestone, saveProject, sendForApproval } from "../actions";
import { Field, Input } from "@/components/site/field";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
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

  return (
    <>
      <PageHeader
        title="Projects"
        meta={`${projects.length} open across ${clientOptions.length} account${clientOptions.length === 1 ? "" : "s"}`}
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <NewProjectForm clients={clientOptions} services={services.map((s) => ({ id: s.id, name: s.name }))} />
        <NewDeliverableForm projects={projectOptions} />
      </div>

      {projects.length === 0 ? (
        <Empty>No projects yet. Create one above once a client has a service assigned.</Empty>
      ) : (
        <ul className="mt-8 space-y-6">
          {projects.map((project) => (
            <Card as="li" key={project.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label-sm text-slate">
                    {project.client.companyName ?? "Client"} · {project.service.name}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-medium text-ink">{project.name}</h3>
                </div>

                {/* Status and progress are one form: they are changed together
                    in practice, and two buttons a centimetre apart is how a
                    progress bar ends up out of step with the status. */}
                <form action={saveProject} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={project.id} />
                  <label htmlFor={`status-${project.id}`} className="sr-only">
                    Status
                  </label>
                  <select
                    id={`status-${project.id}`}
                    name="status"
                    defaultValue={project.status}
                    className="h-10 rounded-sheet border border-ash bg-bone-2 px-3 text-sm text-ink transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <label htmlFor={`progress-${project.id}`} className="sr-only">
                    Progress
                  </label>
                  <input
                    id={`progress-${project.id}`}
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={project.progress}
                    className="tabular h-10 w-20 rounded-sheet border border-ash bg-bone px-3 text-sm text-ink"
                  />
                  <SubmitButton>Save</SubmitButton>
                </form>
              </div>

              <section className="mt-6 border-t border-ash pt-4">
                <SectionTitle count={project.milestones.length}>Milestones</SectionTitle>
                <ul className="mt-3 space-y-2">
                  {project.milestones.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center gap-3 text-sm">
                      <form action={flipMilestone}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="completed" value={String(!m.completed)} />
                        <button
                          type="submit"
                          aria-pressed={m.completed}
                          className={`size-4 rounded-full border transition-colors ${
                            m.completed ? "border-ink bg-ink" : "border-ash hover:border-ink"
                          }`}
                        >
                          <span className="sr-only">
                            {m.completed ? "Mark not done" : "Mark done"}: {m.title}
                          </span>
                        </button>
                      </form>
                      <span className={m.completed ? "text-slate line-through" : "text-ink"}>
                        {m.title}
                      </span>
                      {m.dueDate && (
                        <span className="ml-auto text-xs text-slate">{formatDate(m.dueDate)}</span>
                      )}
                    </li>
                  ))}
                </ul>

                <form action={newMilestone} className="mt-4 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <Field label="New milestone" htmlFor={`ms-${project.id}`} className="min-w-56 flex-1">
                    <Input id={`ms-${project.id}`} name="title" required maxLength={160} />
                  </Field>
                  <Field label="Due" htmlFor={`msd-${project.id}`}>
                    <Input id={`msd-${project.id}`} name="dueDate" type="date" />
                  </Field>
                  <SubmitButton variant="quiet">Add</SubmitButton>
                </form>
              </section>

              <section className="mt-6 border-t border-ash pt-4">
                <SectionTitle count={project.deliverables.length}>Deliverables</SectionTitle>
                {project.deliverables.length === 0 ? (
                  <Empty>Nothing yet.</Empty>
                ) : (
                  <ul className="mt-3 space-y-4">
                    {project.deliverables.map((d) => (
                      <li key={d.id} className="rounded-sheet border border-ash p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink">{d.title}</p>
                            <p className="mt-1 text-xs text-slate">
                              {d.type.replace("_", " ")} · {formatDate(d.createdAt)}
                            </p>
                            {safeUrl(d.fileUrl) ? (
                              <a
                                href={safeUrl(d.fileUrl) as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-sm text-ink underline underline-offset-2"
                              >
                                Open the file
                              </a>
                            ) : (
                              <p className="mt-2 text-sm text-slate">
                                That link is not http or https, so it is not rendered.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Pill tone={TONE[d.status] ?? "neutral"}>
                              {d.status.replace("_", " ")}
                            </Pill>
                            {d.status !== "submitted" && (
                              <form action={sendForApproval}>
                                <input type="hidden" name="id" value={d.id} />
                                <SubmitButton variant="quiet">
                                  {d.status === "draft" ? "Send for approval" : "Resubmit"}
                                </SubmitButton>
                              </form>
                            )}
                          </div>
                        </div>

                        {d.comments.length > 0 && (
                          <ul className="mt-4 space-y-3 border-t border-ash pt-3">
                            {d.comments.map((c) => (
                              <li key={c.id} className="text-sm">
                                <p className="label-sm text-slate">
                                  {c.author.name ?? c.author.email}
                                  {c.author.role === "REGISTERED_USER" && " · client"} ·{" "}
                                  {formatDate(c.createdAt)}
                                </p>
                                <p className="mt-1 leading-relaxed text-ink">{c.body}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        <ReplyForm deliverableId={d.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
