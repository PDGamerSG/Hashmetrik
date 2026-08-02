import type { Metadata } from "next";
import Link from "next/link";
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
  PageHeader,
  Pill,
  SectionTitle,
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

  return (
    <>
      <PageHeader
        title="Projects"
        meta={`${projects.length} in total${status ? ` · ${shown.length} ${status}` : ""}`}
      />

      <nav aria-label="Filter projects" className="mt-6 flex flex-wrap gap-2">
        <FilterLink label="All" href="/admin/projects" active={!status} />
        {PROJECT_STATUSES.map((s) => (
          <FilterLink
            key={s}
            label={`${s}${counts[s] ? ` (${counts[s]})` : ""}`}
            href={`/admin/projects?status=${s}`}
            active={status === s}
          />
        ))}
      </nav>

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
            <ul className="mt-8 space-y-4">
              {shown.map((project) => {
                const done = project.milestones.filter((m) => m.completed).length;
                const waiting = project.deliverables.filter(
                  (d) => d.status === "submitted",
                ).length;
                const overdue =
                  project.endDate &&
                  project.status === "active" &&
                  new Date(project.endDate) < new Date();

                return (
                  <Card as="li" key={project.id}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="label-sm text-slate">
                          {project.client.companyName ?? "Client"} · {project.service.name}
                        </p>
                        <p className="mt-2 font-display text-xl font-medium text-ink">
                          {project.name}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {waiting > 0 && <Pill tone="warn">{waiting} awaiting approval</Pill>}
                        {overdue && <Pill tone="warn">Past its end date</Pill>}
                        <Pill tone={TONE[project.status as keyof typeof TONE] ?? "neutral"}>
                          {project.status}
                        </Pill>
                      </div>
                    </div>

                    <Details>
                      <Detail label="Progress" value={`${project.progress}%`} />
                      <Detail
                        label="Milestones"
                        value={`${done} of ${project.milestones.length} done`}
                      />
                      <Detail label="Starts" value={formatDate(project.startDate)} />
                      <Detail label="Target end" value={formatDate(project.endDate)} />
                    </Details>

                    {/* A plain form posting a server action: no client component,
                        so the whole page still works with JavaScript off, and
                        there is no draft state to get out of step with the row
                        above it. */}
                    <form
                      action={saveProjectPlan}
                      className="mt-4 grid gap-4 border-t border-ash pt-4 sm:grid-cols-2 lg:grid-cols-5"
                    >
                      <input type="hidden" name="id" value={project.id} />

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

                      <div className="flex items-end sm:col-span-2 lg:col-span-5">
                        <SubmitButton>Save plan</SubmitButton>
                      </div>
                    </form>

                    <form action={archiveProject} className="mt-3">
                      <input type="hidden" name="id" value={project.id} />
                      {project.status === "archived" && (
                        <input type="hidden" name="restore" value="true" />
                      )}
                      <SubmitButton variant={project.status === "archived" ? "quiet" : "danger"}>
                        {project.status === "archived" ? "Bring back" : "Archive"}
                      </SubmitButton>
                    </form>

                    {project.milestones.length > 0 && (
                      <section className="mt-5 border-t border-ash pt-4">
                        <SectionTitle count={project.milestones.length}>Milestones</SectionTitle>
                        <ul className="mt-3 space-y-1.5 text-sm">
                          {project.milestones.map((milestone) => (
                            <li key={milestone.id} className="flex flex-wrap gap-x-3 text-slate">
                              <span className={milestone.completed ? "text-slate" : "text-ink"}>
                                {milestone.completed ? "Done" : "Open"}
                              </span>
                              <span className="text-ink">{milestone.title}</span>
                              <span className="tabular">{formatDate(milestone.dueDate)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
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

function FilterLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`label rounded-full border px-3 py-2 transition-colors ${
        active
          ? "border-ink bg-ink text-bone"
          : "border-ash text-slate hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
