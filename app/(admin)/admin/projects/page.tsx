import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { listAllProjects, PROJECT_STATUSES } from "@/lib/projects/store";
import { listClients, listServices } from "@/lib/clients/store";
import { NewProjectForm } from "@/components/app/team-forms";
import { archiveProject, saveProjectPlan } from "../actions";
import { Field, Input, Select } from "@/components/site/field";
import {
  Alert,
  Card,
  Detail,
  Details,
  Empty,
  Fieldset,
  Filter,
  Filters,
  Meter,
  PageHeader,
  Pill,
  SubmitButton,
  formatDate,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Projects" };
export const dynamic = "force-dynamic";

/**
 * Every project in the agency, and the plan behind it.
 *
 * `/team/projects` is the working surface — it is where deliverables are
 * uploaded and milestones ticked, and a team member sees only their own
 * accounts there. This is the governing one: all clients, the timeline, the
 * status, and the archive. The PRD asks for both and they are genuinely
 * different jobs, which is why this is not a filter on that page.
 */

const TONE = {
  active: "live",
  paused: "warn",
  complete: "good",
  archived: "done",
} as const;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const status = (PROJECT_STATUSES as readonly string[]).includes(params.status ?? "")
    ? params.status
    : undefined;

  let projects: Awaited<ReturnType<typeof listAllProjects>> = [];
  let clients: { id: string; name: string }[] = [];
  let services: { id: string; name: string }[] = [];
  let failure: string | null = null;

  try {
    const [rows, clientRows, serviceRows] = await Promise.all([
      listAllProjects(),
      listClients(),
      listServices(),
    ]);
    projects = rows;
    clients = clientRows.map((c) => ({
      id: c.id,
      name: c.companyName ?? c.user.name ?? c.user.email,
    }));
    services = serviceRows.map((s) => ({ id: s.id, name: s.name }));
  } catch (error) {
    console.error("[admin] projects unavailable", error);
    failure = "The database is unreachable. Check DATABASE_URL — see docs/backend-setup.md.";
  }

  const shown = status ? projects.filter((p) => p.status === status) : projects;
  const counts = projects.reduce<Record<string, number>>((tally, project) => {
    tally[project.status] = (tally[project.status] ?? 0) + 1;
    return tally;
  }, {});

  /* The two facts an administrator opens this page for: what is sitting with a
     client, and what has run past the date it promised. */
  const waitingTotal = projects.reduce(
    (sum, project) => sum + project.deliverables.filter((d) => d.status === "submitted").length,
    0,
  );
  const overdueTotal = projects.filter(
    (project) =>
      project.status === "active" && project.endDate && new Date(project.endDate) < new Date(),
  ).length;

  return (
    <>
      <PageHeader
        title="Projects"
        meta={
          projects.length === 0
            ? "Open one against a client and a service below."
            : [
                `${projects.length} in total`,
                waitingTotal > 0 ? `${waitingTotal} awaiting approval` : null,
                overdueTotal > 0 ? `${overdueTotal} past its end date` : null,
              ]
                .filter(Boolean)
                .join(" · ")
        }
      />

      <Filters label="Filter projects">
        <Filter label="All" href="/admin/projects" active={!status} count={projects.length} />
        {PROJECT_STATUSES.map((s) => (
          <Filter
            key={s}
            label={s}
            count={counts[s] ?? 0}
            href={`/admin/projects?status=${s}`}
            active={status === s}
          />
        ))}
      </Filters>

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <NewProjectForm clients={clients} services={services} />
          </div>

          {shown.length === 0 ? (
            <Empty>
              {status
                ? `Nothing is ${status}.`
                : "No projects yet. Open one against a client and a service above."}
            </Empty>
          ) : (
            <ul className="mt-6 space-y-5">
              {shown.map((project) => {
                const done = project.milestones.filter((m) => m.completed).length;
                const waiting = project.deliverables.filter((d) => d.status === "submitted").length;
                const overdue =
                  project.endDate &&
                  project.status === "active" &&
                  new Date(project.endDate) < new Date();

                return (
                  <Card as="li" key={project.id} className="transition-colors hover:border-ink/25">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <p className="font-display text-xl leading-tight font-medium text-ink">
                          {project.name}
                        </p>
                        <p className="mt-1.5 text-sm text-slate">
                          {project.client.companyName ?? "Client"} · {project.service.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {waiting > 0 && (
                          <Pill tone="warn" dot>
                            {waiting} awaiting approval
                          </Pill>
                        )}
                        {overdue && (
                          <Pill tone="warn" dot>
                            Past its end date
                          </Pill>
                        )}
                        <Pill tone={TONE[project.status as keyof typeof TONE] ?? "neutral"}>
                          {project.status}
                        </Pill>
                      </div>
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

                    <Details>
                      <Detail label="Starts" value={formatDate(project.startDate)} />
                      <Detail label="Target end" value={formatDate(project.endDate)} />
                      <Detail label="Deliverables" value={String(project.deliverables.length)} />
                      <Detail label="Client" value={project.client.companyName} />
                    </Details>

                    {project.milestones.length > 0 && (
                      <Fieldset legend="Milestones">
                        <ol className="mt-3 space-y-2">
                          {project.milestones.map((milestone) => (
                            <li key={milestone.id} className="flex items-baseline gap-3 text-sm">
                              <span
                                aria-hidden
                                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                                  milestone.completed ? "bg-ink" : "border border-ash"
                                }`}
                              />
                              <span
                                className={
                                  milestone.completed ? "text-slate line-through" : "text-ink"
                                }
                              >
                                {milestone.title}
                              </span>
                              <span className="tabular ml-auto shrink-0 text-xs text-slate">
                                {formatDate(milestone.dueDate)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </Fieldset>
                    )}

                    {/* A plain form posting a server action: no client component,
                        so the whole page still works with JavaScript off, and
                        there is no draft state to get out of step with the row
                        above it. */}
                    <form action={saveProjectPlan}>
                      <input type="hidden" name="id" value={project.id} />
                      <Fieldset legend="The plan">
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                          <Field label="Name" htmlFor={`name-${project.id}`} className="lg:col-span-2">
                            <Input
                              id={`name-${project.id}`}
                              name="name"
                              defaultValue={project.name}
                              maxLength={120}
                            />
                          </Field>

                          <Field label="Status" htmlFor={`status-${project.id}`}>
                            <Select
                              id={`status-${project.id}`}
                              name="status"
                              defaultValue={project.status}
                            >
                              {PROJECT_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </Select>
                          </Field>

                          <Field label="Progress %" htmlFor={`progress-${project.id}`}>
                            <Input
                              id={`progress-${project.id}`}
                              name="progress"
                              type="number"
                              min={0}
                              max={100}
                              defaultValue={project.progress}
                            />
                          </Field>

                          <Field label="Starts" htmlFor={`start-${project.id}`}>
                            <Input
                              id={`start-${project.id}`}
                              name="startDate"
                              type="date"
                              defaultValue={toDateInput(project.startDate)}
                            />
                          </Field>

                          <Field label="Target end" htmlFor={`end-${project.id}`}>
                            <Input
                              id={`end-${project.id}`}
                              name="endDate"
                              type="date"
                              defaultValue={toDateInput(project.endDate)}
                            />
                          </Field>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <SubmitButton busyLabel="Saving…">Save plan</SubmitButton>
                        </div>
                      </Fieldset>
                    </form>

                    <form action={archiveProject} className="mt-4 border-t border-ash pt-4">
                      <input type="hidden" name="id" value={project.id} />
                      {project.status === "archived" && (
                        <input type="hidden" name="restore" value="true" />
                      )}
                      <SubmitButton
                        size="sm"
                        variant={project.status === "archived" ? "quiet" : "danger"}
                        busyLabel="Working…"
                      >
                        {project.status === "archived" ? "Bring back" : "Archive"}
                      </SubmitButton>
                    </form>
                  </Card>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/** What a `type="date"` input wants: `YYYY-MM-DD`, in no timezone at all. */
function toDateInput(value: Date | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
