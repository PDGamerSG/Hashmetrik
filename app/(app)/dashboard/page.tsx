import type { Metadata } from "next";
import { verifySession } from "@/lib/auth/dal";
import { listConsultationsForUser } from "@/lib/consultations/store";
import { listLeadsForUser } from "@/lib/leads/store";
import { prisma } from "@/lib/db";
import { ConsultationRequest, ProfileForm } from "@/components/app/account-forms";
import {
  ButtonLink,
  Card,
  Detail,
  Details,
  Empty,
  PageHeader,
  Pill,
  Row,
  Rows,
  Section,
  formatDate,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

const CONSULTATION_TONE = {
  requested: "neutral",
  scheduled: "live",
  completed: "done",
  cancelled: "done",
} as const;

export default async function DashboardPage() {
  const viewer = await verifySession();

  const [profile, consultations, enquiries, client] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewer.id },
      select: { name: true, email: true, phone: true, businessName: true, businessType: true },
    }),
    listConsultationsForUser(viewer.id),
    listLeadsForUser(viewer.id),
    prisma.client.findUnique({
      where: { userId: viewer.id },
      select: {
        companyName: true,
        onboardedAt: true,
        services: { select: { service: { select: { name: true } } } },
        accountManager: { select: { user: { select: { name: true, email: true } } } },
      },
    }),
  ]);

  const upcoming = consultations.filter((c) => c.status === "scheduled" && c.scheduledAt);

  return (
    <>
      <PageHeader
        title={profile?.name ? `Hello, ${profile.name.split(" ")[0]}` : "Your account"}
        status={upcoming.length > 0 ? "CALL BOOKED" : "NO CALL BOOKED"}
        meta={
          upcoming.length > 0
            ? `Your next call is ${formatDateTime(upcoming[0].scheduledAt)}.`
            : client
              ? `Client since ${formatDate(client.onboardedAt)} · ${client.services.length} service${client.services.length === 1 ? "" : "s"} running`
              : "Registered account. Book a consultation to get started."
        }
        actions={
          client ? (
            <ButtonLink href="/dashboard/client">Go to your work</ButtonLink>
          ) : (
            <ButtonLink href="/book">Book a consultation</ButtonLink>
          )
        }
      />

      {client && (
        <Card className="mt-8">
          <Details className="mt-0 border-t-0 pt-0 sm:grid-cols-3">
            <Detail label="Company" value={client.companyName} />
            <Detail
              label="Account manager"
              value={
                client.accountManager
                  ? (client.accountManager.user.name ?? client.accountManager.user.email)
                  : "To be assigned"
              }
            />
            <Detail
              label="Services"
              value={client.services.map((s) => s.service.name).join(", ") || "None yet"}
            />
          </Details>
        </Card>
      )}

      <Section title="Consultations" count={consultations.length}>
        {consultations.length === 0 ? (
          <Empty
            action={
              <ButtonLink href="/book" variant="quiet" size="sm">
                Pick a slot
              </ButtonLink>
            }
          >
            No consultations yet. Ask for one below, or use the booking page to choose a time that
            already suits you.
          </Empty>
        ) : (
          <Rows>
            {consultations.map((c) => (
              <Row
                key={c.id}
                title={c.topic ?? "Consultation"}
                subtitle={
                  c.scheduledAt
                    ? formatDateTime(c.scheduledAt)
                    : `Requested ${formatDate(c.createdAt)}`
                }
                status={
                  <Pill
                    tone={CONSULTATION_TONE[c.status as keyof typeof CONSULTATION_TONE] ?? "neutral"}
                    dot
                  >
                    {c.status}
                  </Pill>
                }
              >
                {c.notes && (
                  <p className="max-w-prose border-l border-ash pl-4 text-sm leading-relaxed text-slate">
                    {c.notes}
                  </p>
                )}
              </Row>
            ))}
          </Rows>
        )}

        <Card className="mt-6">
          <p className="label-xs text-slate">Ask for a call</p>
          <div className="mt-4">
            <ConsultationRequest />
          </div>
        </Card>
      </Section>

      {enquiries.length > 0 && (
        <Section title="Your enquiries" count={enquiries.length}>
          <Rows>
            {enquiries.map((lead) => (
              <Row
                key={lead.id}
                title={lead.kind === "booking" ? "Booking request" : "Contact form"}
                subtitle={formatDate(lead.createdAt)}
                status={<Pill tone={lead.status === "closed" ? "done" : "live"} dot>{lead.status}</Pill>}
              >
                {lead.message && (
                  <p className="max-w-prose border-l border-ash pl-4 text-sm leading-relaxed text-slate">
                    {lead.message}
                  </p>
                )}
              </Row>
            ))}
          </Rows>
        </Section>
      )}

      <Section title="Your details">
        <Card className="mt-5">
          <ProfileForm
            defaults={{
              name: profile?.name ?? "",
              phone: profile?.phone ?? "",
              businessName: profile?.businessName ?? "",
              businessType: profile?.businessType ?? "",
            }}
            email={viewer.email}
          />
        </Card>
      </Section>
    </>
  );
}
