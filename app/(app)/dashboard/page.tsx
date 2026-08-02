import type { Metadata } from "next";
import Link from "next/link";
import { verifySession } from "@/lib/auth/dal";
import { listConsultationsForUser } from "@/lib/consultations/store";
import { listLeadsForUser } from "@/lib/leads/store";
import { prisma } from "@/lib/db";
import { ConsultationRequest, ProfileForm } from "@/components/app/account-forms";
import {
  ButtonLink,
  Card,
  Details,
  Detail,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
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

  const upcoming = consultations.filter((c) => c.status === "scheduled");

  return (
    <>
      <PageHeader
        title={profile?.name ? `Hello, ${profile.name.split(" ")[0]}` : "Your account"}
        meta={
          client
            ? `Client since ${formatDate(client.onboardedAt)} · ${client.services.length} service${client.services.length === 1 ? "" : "s"}`
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
          <SectionTitle>Your account team</SectionTitle>
          <Details>
            <Detail label="Company" value={client.companyName} />
            <Detail
              label="Account manager"
              value={
                client.accountManager
                  ? client.accountManager.user.name ?? client.accountManager.user.email
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

      <section className="mt-10">
        <SectionTitle count={consultations.length}>Consultations</SectionTitle>

        {upcoming.length > 0 && (
          <p className="mt-3 text-sm text-slate">
            Next: {formatDateTime(upcoming[0].scheduledAt)}
          </p>
        )}

        {consultations.length === 0 ? (
          <Empty>
            No consultations yet. Ask for one below, or use the{" "}
            <Link href="/book" className="text-ink underline underline-offset-2">
              booking page
            </Link>{" "}
            to pick a slot.
          </Empty>
        ) : (
          <ul className="mt-4 space-y-3">
            {consultations.map((c) => (
              <Card as="li" key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{c.topic ?? "Consultation"}</p>
                    <p className="mt-1 text-sm text-slate">
                      {c.scheduledAt
                        ? formatDateTime(c.scheduledAt)
                        : `Requested ${formatDate(c.createdAt)}`}
                    </p>
                  </div>
                  <Pill
                    tone={CONSULTATION_TONE[c.status as keyof typeof CONSULTATION_TONE] ?? "neutral"}
                  >
                    {c.status}
                  </Pill>
                </div>
                {c.notes && (
                  <p className="mt-3 border-t border-ash pt-3 text-sm leading-relaxed text-ink">
                    {c.notes}
                  </p>
                )}
              </Card>
            ))}
          </ul>
        )}

        <Card className="mt-4">
          <SectionTitle>Ask for a call</SectionTitle>
          <div className="mt-4">
            <ConsultationRequest />
          </div>
        </Card>
      </section>

      {enquiries.length > 0 && (
        <section className="mt-10">
          <SectionTitle count={enquiries.length}>Your enquiries</SectionTitle>
          <ul className="mt-4 space-y-3">
            {enquiries.map((lead) => (
              <Card as="li" key={lead.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-sm text-ink">
                    {lead.kind === "booking" ? "Booking request" : "Contact form"} ·{" "}
                    <span className="text-slate">{formatDate(lead.createdAt)}</span>
                  </p>
                  <Pill tone={lead.status === "closed" ? "done" : "live"}>{lead.status}</Pill>
                </div>
                {lead.message && (
                  <p className="mt-3 text-sm leading-relaxed text-slate">{lead.message}</p>
                )}
              </Card>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <SectionTitle>Your details</SectionTitle>
        <Card className="mt-4">
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
      </section>
    </>
  );
}
