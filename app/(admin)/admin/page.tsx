import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { listAudit } from "@/lib/audit";
import { serviceUptake } from "@/lib/clients/store";
import {
  Alert,
  Empty,
  Meter,
  PageHeader,
  Readout,
  Readouts,
  Row,
  Rows,
  Section,
  formatCount,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

/**
 * The one screen that answers "what is going on".
 *
 * Counts rather than lists: each number is a link to the page that has the
 * detail, and a dashboard that tries to be every other page is one nobody reads
 * the top of.
 *
 * The five headline numbers are the ones the PRD asks for — clients, active
 * projects, team members, new leads, pending approvals — in that order, with the
 * two that mean somebody is waiting on the agency (leads, approvals) first,
 * because those are the ones that decay if the page is not read today. The
 * service breakdown underneath answers the PRD's other question, "which part of
 * the business is carrying the agency".
 */
export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  let stats: {
    leads: number;
    newLeads: number;
    consultations: number;
    users: number;
    clients: number;
    staff: number;
    waiting: number;
    calendarWaiting: number;
    activeProjects: number;
    published: number;
    suspended: number;
  } | null = null;
  let uptake: Awaited<ReturnType<typeof serviceUptake>> = [];
  let recent: Awaited<ReturnType<typeof listAudit>> = [];
  let failure: string | null = null;

  try {
    const [
      leads,
      newLeads,
      consultations,
      users,
      clients,
      staff,
      waiting,
      calendarWaiting,
      activeProjects,
      published,
      suspended,
      services,
      audit,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.consultation.count({ where: { status: { in: ["requested", "scheduled"] } } }),
      prisma.user.count({ where: { role: "REGISTERED_USER" } }),
      prisma.client.count(),
      prisma.user.count({ where: { role: { in: ["TEAM_MEMBER", "ADMIN"] } } }),
      prisma.deliverable.count({ where: { status: "submitted" } }),
      prisma.contentCalendarEntry.count({ where: { approvalStatus: "pending" } }),
      prisma.project.count({ where: { status: "active" } }),
      prisma.cMSContent.count({ where: { publishedAt: { not: null } } }),
      prisma.user.count({ where: { suspendedAt: { not: null } } }),
      serviceUptake(),
      listAudit(12),
    ]);
    stats = {
      leads,
      newLeads,
      consultations,
      users,
      clients,
      staff,
      waiting,
      calendarWaiting,
      activeProjects,
      published,
      suspended,
    };
    uptake = services;
    recent = audit;
  } catch (error) {
    console.error("[admin] overview unavailable", error);
    failure = "The database is unreachable. Check DATABASE_URL — see docs/backend-setup.md.";
  }

  /* The scale every service bar is drawn against. One denominator for the
     whole panel, so the bars compare with each other rather than each one
     filling itself to its own maximum. */
  const busiest = Math.max(1, ...uptake.map((service) => service.clients));

  const waiting = stats ? stats.waiting + stats.calendarWaiting : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        /* The board's own headline: the two readings that decay if nobody
           looks today, on flaps, which turn when either of them changes. */
        status={
          stats
            ? stats.newLeads + waiting > 0
              ? `${stats.newLeads} LEADS ${waiting} APPROVALS`
              : "ALL CLEAR"
            : "BOARD OFFLINE"
        }
        meta={
          stats
            ? waiting + stats.newLeads > 0
              ? `${stats.newLeads} lead${stats.newLeads === 1 ? "" : "s"} and ${waiting} approval${waiting === 1 ? "" : "s"} are waiting on the agency.`
              : "Nothing is waiting on the agency."
            : `Signed in as ${admin.email}`
        }
      />

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : (
        stats && (
          <>
            {/* The two readings that decay if this page is not read today come
                first and carry the pilot light. The rest are the standing size
                of the business, which is worth knowing and never urgent. */}
            <Readouts>
              <Readout
                label="New leads"
                value={formatCount(stats.newLeads)}
                of={formatCount(stats.leads)}
                note="Unopened enquiries"
                href="/admin/leads?status=new"
                urgent
              />
              <Readout
                label="Pending approvals"
                value={formatCount(waiting)}
                note="Deliverables and calendar posts sitting with a client"
                href="/admin/projects"
                urgent
              />
              <Readout
                label="Calls open"
                value={formatCount(stats.consultations)}
                note="Requested or scheduled"
                href="/admin/consultations"
                urgent
              />
              <Readout
                label="Active projects"
                value={formatCount(stats.activeProjects)}
                note="In flight across all clients"
                href="/admin/projects"
              />
            </Readouts>

            {/* The standing size of the business, at half the weight of the
                four readings above and joined to them by a single hairline —
                one console with a main face and a secondary strip, rather than
                two panels that happen to be stacked. */}
            <Readouts className="mt-px">
              <Readout
                label="Clients"
                value={formatCount(stats.clients)}
                href="/admin/clients"
                compact
              />
              <Readout label="Team" value={formatCount(stats.staff)} href="/admin/team" compact />
              <Readout
                label="Accounts"
                value={formatCount(stats.users)}
                note={stats.suspended > 0 ? `${stats.suspended} suspended` : undefined}
                href={stats.suspended > 0 ? "/admin/users?view=suspended" : "/admin/users"}
                compact
              />
              <Readout
                label="Published content"
                value={formatCount(stats.published)}
                href="/admin/cms"
                compact
              />
            </Readouts>

            <Section
              title="Services"
              count={uptake.length}
              action={
                <Link
                  href="/admin/settings"
                  className="label-sm text-slate transition-colors hover:text-ink"
                >
                  Catalogue
                </Link>
              }
            >
              {uptake.length === 0 ? (
                <Empty>
                  No services in the catalogue yet. Add them in settings and they become the
                  columns every client is measured against.
                </Empty>
              ) : (
                /* Which part of the business is carrying the agency — the
                   question the numbers alone made you do arithmetic for. */
                <ul className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  {uptake.map((service) => (
                    <li key={service.id}>
                      <Meter
                        label={service.name}
                        value={service.clients}
                        max={busiest}
                        display={
                          <>
                            {formatCount(service.clients)}
                            <span className="text-slate">
                              {service.clients === 1 ? " client" : " clients"} ·{" "}
                              {formatCount(service.projects)} live
                            </span>
                          </>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Recent activity" count={recent.length}>
              {recent.length === 0 ? (
                <Empty>
                  Nothing logged yet. Activations, service changes and staff accounts are
                  recorded here.
                </Empty>
              ) : (
                <Rows>
                  {recent.map((entry) => (
                    <Row
                      key={entry.id}
                      title={entry.action}
                      subtitle={entry.entity}
                      meta={[
                        {
                          label: "By",
                          value: entry.actor
                            ? (entry.actor.name ?? entry.actor.email)
                            : "System",
                        },
                        { label: "When", value: formatDateTime(entry.createdAt) },
                      ]}
                    />
                  ))}
                </Rows>
              )}
            </Section>
          </>
        )
      )}
    </>
  );
}
