import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/dal";
import { prisma } from "@/lib/db";
import { listAudit } from "@/lib/audit";
import { Alert, Card, Empty, PageHeader, SectionTitle, formatDateTime } from "@/components/app/ui";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

/**
 * The one screen that answers "what is going on".
 *
 * Counts rather than lists: each number is a link to the page that has the
 * detail, and a dashboard that tries to be every other page is one nobody reads
 * the top of.
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
    published: number;
  } | null = null;
  let recent: Awaited<ReturnType<typeof listAudit>> = [];
  let failure: string | null = null;

  try {
    const [leads, newLeads, consultations, users, clients, staff, waiting, published, audit] =
      await Promise.all([
        prisma.lead.count(),
        prisma.lead.count({ where: { status: "new" } }),
        prisma.consultation.count({ where: { status: { in: ["requested", "scheduled"] } } }),
        prisma.user.count({ where: { role: "REGISTERED_USER" } }),
        prisma.client.count(),
        prisma.user.count({ where: { role: { in: ["TEAM_MEMBER", "ADMIN"] } } }),
        prisma.deliverable.count({ where: { status: "submitted" } }),
        prisma.cMSContent.count({ where: { publishedAt: { not: null } } }),
        listAudit(12),
      ]);
    stats = { leads, newLeads, consultations, users, clients, staff, waiting, published };
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
              <Stat label="Calls open" value={stats.consultations} href="/admin/consultations" />
              <Stat label="Waiting on clients" value={stats.waiting} href="/admin/clients" />
              <Stat label="Clients" value={stats.clients} href="/admin/clients" />
              <Stat label="Registered accounts" value={stats.users} href="/admin/users" />
              <Stat label="Staff" value={stats.staff} href="/admin/team" />
              <Stat label="Published content" value={stats.published} href="/admin/cms" />
            </div>

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
