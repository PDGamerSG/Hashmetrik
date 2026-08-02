import type { Metadata } from "next";
import { requireClient } from "@/lib/auth/dal";
import { listProjectsForClient } from "@/lib/projects/store";
import { prisma } from "@/lib/db";
import { DeliverableDecision } from "@/components/app/client-forms";
import { safeUrl } from "@/lib/url";
import {
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
  formatDate,
  type Tone,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Your work" };
export const dynamic = "force-dynamic";

const DELIVERABLE_TONE: Record<string, Tone> = {
  draft: "neutral",
  submitted: "warn",
  approved: "good",
  changes_requested: "warn",
};

const DELIVERABLE_LABEL: Record<string, string> = {
  draft: "In progress",
  submitted: "Waiting on you",
  approved: "Approved",
  changes_requested: "Changes requested",
};

export default async function ClientWorkPage() {
  const { client } = await requireClient();

  const [projects, services] = await Promise.all([
    listProjectsForClient(client.id),
    prisma.clientService.findMany({
      where: { clientId: client.id },
      select: { id: true, status: true, startedAt: true, service: { select: { name: true } } },
    }),
  ]);

  const waiting = projects
    .flatMap((p) => p.deliverables)
    .filter((d) => d.status === "submitted").length;

  return (
    <>
      <PageHeader
        eyebrow={client.companyName ?? "Client"}
        title="Your work"
        meta={
          waiting > 0
            ? `${waiting} item${waiting === 1 ? "" : "s"} waiting on your approval`
            : "Nothing is waiting on you"
        }
      />

      <section className="mt-8">
        <SectionTitle count={services.length}>Services</SectionTitle>
        {services.length === 0 ? (
          <Empty>No services assigned yet. Your account manager will set these up.</Empty>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <Pill tone={s.status === "active" ? "live" : "done"}>
                  {s.service.name} · since {formatDate(s.startedAt)}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle count={projects.length}>Projects</SectionTitle>

        {projects.length === 0 ? (
          <Empty>No projects yet. They appear here as soon as the team opens one.</Empty>
        ) : (
          <ul className="mt-4 space-y-6">
            {projects.map((project) => (
              <Card as="li" key={project.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="label-sm text-slate">{project.service.name}</p>
                    <h3 className="mt-1 font-display text-xl font-medium text-ink">
                      {project.name}
                    </h3>
                  </div>
                  <Pill tone={project.status === "complete" ? "done" : "live"}>
                    {project.status}
                  </Pill>
                </div>

                {/* A bar rather than a number alone: the point of progress is
                    the comparison between projects, and a row of percentages
                    has to be read one at a time. */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="label-sm text-slate">Progress</span>
                    <span className="tabular text-sm text-ink">{project.progress}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={project.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${project.name} progress`}
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ash"
                  >
                    <div className="h-full bg-ink" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>

                <Details>
                  <Detail label="Started" value={formatDate(project.startDate)} />
                  <Detail label="Target" value={formatDate(project.endDate)} />
                  <Detail
                    label="Milestones"
                    value={`${project.milestones.filter((m) => m.completed).length} of ${project.milestones.length}`}
                  />
                </Details>

                {project.milestones.length > 0 && (
                  <ol className="mt-4 space-y-2 border-t border-ash pt-4">
                    {project.milestones.map((m) => (
                      <li key={m.id} className="flex items-baseline gap-3 text-sm">
                        <span
                          aria-hidden
                          className={`mt-1 size-2 shrink-0 rounded-full ${m.completed ? "bg-ink" : "border border-ash bg-transparent"}`}
                        />
                        <span className={m.completed ? "text-slate line-through" : "text-ink"}>
                          {m.title}
                        </span>
                        {m.dueDate && (
                          <span className="ml-auto shrink-0 text-xs text-slate">
                            {formatDate(m.dueDate)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                {project.deliverables.length > 0 && (
                  <div className="mt-6 border-t border-ash pt-4">
                    <SectionTitle count={project.deliverables.length}>Deliverables</SectionTitle>
                    <ul className="mt-3 space-y-4">
                      {project.deliverables
                        /* Drafts are the team's working state; showing them
                           would mean asking a client to ignore half the list. */
                        .filter((d) => d.status !== "draft")
                        .map((d) => (
                          <li key={d.id} className="rounded-sheet border border-ash p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-ink">{d.title}</p>
                                <p className="mt-1 text-xs text-slate">
                                  {d.type.replace("_", " ")} · {formatDate(d.submittedAt ?? d.createdAt)}
                                </p>
                              </div>
                              <Pill tone={DELIVERABLE_TONE[d.status] ?? "neutral"}>
                                {DELIVERABLE_LABEL[d.status] ?? d.status}
                              </Pill>
                            </div>

                            {/* Checked again here, not only on the way in: a row
                                stored before that check existed would otherwise
                                still render a `javascript:` link at the client. */}
                            {safeUrl(d.fileUrl) ? (
                              <a
                                href={safeUrl(d.fileUrl) as string}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-block text-sm text-ink underline underline-offset-2"
                              >
                                Open the file
                              </a>
                            ) : (
                              <p className="mt-3 text-sm text-slate">
                                The link on this file is not one we can open. Ask your account
                                manager to re-send it.
                              </p>
                            )}

                            {d.comments.length > 0 && (
                              <ul className="mt-4 space-y-3 border-t border-ash pt-3">
                                {d.comments.map((c) => (
                                  <li key={c.id} className="text-sm">
                                    <p className="label-sm text-slate">
                                      {c.author.name ?? c.author.email} ·{" "}
                                      {formatDate(c.createdAt)}
                                    </p>
                                    <p className="mt-1 leading-relaxed text-ink">{c.body}</p>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="mt-4 border-t border-ash pt-4">
                              <DeliverableDecision id={d.id} status={d.status} />
                            </div>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
