import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { listAudit } from "@/lib/audit";
import { serviceUptake } from "@/lib/clients/store";
import {
  Alert,
  Card,
  Empty,
  PageHeader,
  SectionTitle,
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

  return (
    <>
      <PageHeader title="Overview" meta={`Signed in as ${admin.email}`} />

      {failure ? (
        <div className="mt-10">
          <Alert>{failure}</Alert>
        </div>
      ) : (
        stats && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="New leads" value={stats.newLeads} of={stats.leads} href="/admin/leads?status=new" />
              <Stat
                label="Pending approvals"
                value={stats.waiting + stats.calendarWaiting}
                href="/admin/projects"
              />
              <Stat label="Clients" value={stats.clients} href="/admin/clients" />
              <Stat label="Active projects" value={stats.activeProjects} href="/admin/projects" />
              <Stat label="Team members" value={stats.staff} href="/admin/team" />
              <Stat label="Calls open" value={stats.consultations} href="/admin/consultations" />
              <Stat label="Registered accounts" value={stats.users} href="/admin/users" />
              <Stat label="Published content" value={stats.published} href="/admin/cms" />
              {stats.suspended > 0 && (
                <Stat
                  label="Suspended accounts"
                  value={stats.suspended}
                  href="/admin/users?view=suspended"
                />
              )}
            </div>

            <section className="mt-10">
              <SectionTitle count={uptake.length}>Services</SectionTitle>
              {uptake.length === 0 ? (
                <Empty>No services in the catalogue yet.</Empty>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {uptake.map((service) => (
                    <Card as="li" key={service.id}>
                      <p className="text-sm font-medium text-ink">{service.name}</p>
                      <p className="tabular mt-2 text-sm text-slate">
                        <span className="text-ink">{service.clients}</span>
                        {service.clients === 1 ? " client" : " clients"}
                        {" · "}
                        <span className="text-ink">{service.projects}</span> active
                        {service.projects === 1 ? " project" : " projects"}
                      </p>
                    </Card>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-10">
              <SectionTitle count={recent.length}>Recent activity</SectionTitle>
              {recent.length === 0 ? (
                <Empty>
                  Nothing logged yet. Activations, service changes and staff accounts are
                  recorded here.
                </Empty>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recent.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                      <span className="tabular text-xs text-slate">
                        {formatDateTime(entry.createdAt)}
                      </span>
                      <span className="text-ink">{entry.action}</span>
                      <span className="text-slate">
                        {entry.entity}
                        {entry.actor && ` · ${entry.actor.name ?? entry.actor.email}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </>
  );
}

function Stat({
  label,
  value,
  of,
  href,
}: {
  label: string;
  value: number;
  of?: number;
  href: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-colors group-hover:border-ink">
        <p className="label-sm text-slate">{label}</p>
        <p className="tabular mt-3 font-display text-3xl font-medium text-ink">
          {value}
          {of !== undefined && <span className="ml-2 text-base text-slate">of {of}</span>}
        </p>
      </Card>
    </Link>
  );
}
