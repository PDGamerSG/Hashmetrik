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
  Dial,
  Empty,
  Meter,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Section,
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

  const deliverables = projects.flatMap((p) => p.deliverables);
  const waiting = deliverables.filter((d) => d.status === "submitted").length;
  const approved = deliverables.filter((d) => d.status === "approved").length;
  const active = projects.filter((p) => p.status !== "complete").length;

  const milestones = projects.flatMap((p) => p.milestones);
  const milestonesDone = milestones.filter((m) => m.completed).length;

  return (
    <>
      <PageHeader
        title="Your work"
        status={waiting > 0 ? `${waiting} WAITING ON YOU` : "ALL CLEAR"}
        meta={
          waiting > 0
            ? `${waiting} item${waiting === 1 ? "" : "s"} need your approval before the team can move on.`
            : "Nothing is waiting on you."
        }
      />

      <Readouts>
        <Readout
          label="Waiting on you"
          value={waiting}
          note={waiting > 0 ? "Approve or send back below" : "Nothing to review"}
          urgent
        />
        <Readout
          label="Projects running"
          value={active}
          of={projects.length > active ? projects.length : undefined}
          note="Open across your services"
        />
        <Readout
          label="Milestones done"
          value={milestonesDone}
          of={milestones.length || undefined}
          note="Across every project"
        />
        <Readout label="Approved" value={approved} note="Signed off by you" />
      </Readouts>

      <Section title="Services" count={services.length}>
        {services.length === 0 ? (
          <Empty>No services assigned yet. Your account manager will set these up.</Empty>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-2">
            {services.map((s) => (
              <li key={s.id}>
                <Pill tone={s.status === "active" ? "live" : "done"} dot>
                  {s.service.name} · since {formatDate(s.startedAt)}
                </Pill>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Projects" count={projects.length}>
        {projects.length === 0 ? (
          <Empty>No projects yet. They appear here as soon as the team opens one.</Empty>
        ) : (
          <ul className="mt-5 space-y-6">
            {projects.map((project) => {
              const done = project.milestones.filter((m) => m.completed).length;
              /* Drafts are the team's working state; showing them would mean
                 asking a client to ignore half the list. */
              const visible = project.deliverables.filter((d) => d.status !== "draft");

              return (
                <Card as="li" key={project.id}>
                  {/* The dial reads the one thing a client opens this page to
                      find out — how far through their project is — against a
                      printed scale, which eight pixels of bar could only imply.
                      Milestones stay a bar beside it: that is a count out of a
                      count, and it is compared down the column from one project
                      to the next, which is what a bar is for. One instrument per
                      record; a grid of dials would be the tile wall again. */}
                  <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
                    <div className="flex min-w-0 flex-1 basis-64 flex-wrap items-start gap-x-8 gap-y-5">
                      {/* Always the lit flap, never the coral. Coral on this
                          board means somebody is being asked for a decision,
                          and a project being half finished is not a decision
                          anybody owes — the deliverables below are where that
                          question lives, and they carry the lamp. */}
                      <Dial label="Progress" value={project.progress} className="shrink-0" />
                      <div className="min-w-0 flex-1 basis-48">
                        <h3 className="font-display text-xl leading-tight font-medium text-ink">
                          {project.name}
                        </h3>
                        <p className="mt-1.5 text-sm text-slate">{project.service.name}</p>

                        {project.milestones.length > 0 && (
                          <div className="mt-5 max-w-sm">
                            <Meter
                              label="Milestones"
                              value={done}
                              max={project.milestones.length}
                              display={`${done} of ${project.milestones.length}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <Pill tone={project.status === "complete" ? "good" : "live"} dot>
                      {project.status}
                    </Pill>
                  </div>

                  <Details className="sm:grid-cols-3">
                    <Detail label="Started" value={formatDate(project.startDate)} />
                    <Detail label="Target" value={formatDate(project.endDate)} />
                    <Detail label="Deliverables" value={String(visible.length)} />
                  </Details>

                  {project.milestones.length > 0 && (
                    <div className="mt-5 border-t border-ash pt-5">
                      <p className="label-xs text-slate">The plan</p>
                      <ol className="mt-3 space-y-2.5">
                        {project.milestones.map((m) => (
                          <li key={m.id} className="flex items-baseline gap-3 text-sm">
                            <span
                              aria-hidden
                              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${m.completed ? "bg-ink" : "border border-ash"}`}
                            />
                            <span className={m.completed ? "text-slate line-through" : "text-ink"}>
                              {m.title}
                            </span>
                            {m.dueDate && (
                              <span className="tabular ml-auto shrink-0 text-xs text-slate">
                                {formatDate(m.dueDate)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {visible.length > 0 && (
                    <div className="mt-6 border-t border-ash pt-5">
                      <div className="flex items-center gap-4">
                        <p className="label-xs shrink-0 text-slate">Deliverables</p>
                        <span aria-hidden className="h-px flex-1 bg-ash" />
                        <span className="tabular label-xs text-ink">{visible.length}</span>
                      </div>

                      {/* Ruled off from one another rather than boxed: a box
                          inside a box is two edges saying the same thing, and
                          the decision below each one is what should stand out. */}
                      <ul className="mt-2 divide-y divide-ash">
                        {visible.map((d) => (
                          <li key={d.id} className="py-5 first:pt-4 last:pb-0">
                            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                              <div className="min-w-0">
                                <p className="text-[15px] leading-snug font-medium text-ink">
                                  {d.title}
                                </p>
                                <p className="label-xs mt-1.5 text-slate">
                                  {d.type.replace("_", " ")} ·{" "}
                                  <span className="tabular">
                                    {formatDate(d.submittedAt ?? d.createdAt)}
                                  </span>
                                </p>
                              </div>
                              <Pill tone={DELIVERABLE_TONE[d.status] ?? "neutral"} dot>
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
                                className="mt-3 inline-block text-sm text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-ink"
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
                              <ul className="mt-4 space-y-3 border-l border-ash pl-4">
                                {d.comments.map((c) => (
                                  <li key={c.id} className="text-sm">
                                    <p className="label-xs text-slate">
                                      {c.author.name ?? c.author.email} ·{" "}
                                      <span className="tabular">{formatDate(c.createdAt)}</span>
                                    </p>
                                    <p className="mt-1.5 leading-relaxed text-ink">{c.body}</p>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <div className="mt-4">
                              <DeliverableDecision id={d.id} status={d.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </Section>
    </>
  );
}
