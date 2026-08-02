import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignupForm } from "@/components/app/auth-forms";
import { AuthShell, type Reading } from "@/components/site/auth-shell";
import { optionalSession } from "@/lib/auth/dal";
import { homeFor } from "@/lib/auth/gate";

export const metadata: Metadata = { title: "Create an account" };

export const dynamic = "force-dynamic";

/* An account before a service, so the list is what the account does on day one
   and what it turns into — not a feature grid for something not bought yet. */
const READINGS: readonly Reading[] = [
  {
    label: "Book a consultation",
    note: "Pick a time that suits you and see it confirmed, without a thread of emails.",
  },
  {
    label: "Keep it in one place",
    note: "What was discussed, what was quoted, and what you decided — all on the record.",
  },
  {
    label: "It becomes your dashboard",
    note: "Take on a service and the same account carries the projects, approvals and reporting.",
  },
];

export default async function SignupPage() {
  const session = await optionalSession();
  if (session) redirect(homeFor(session));

  return (
    <AuthShell
      wide
      title="Create an account"
      lede="Track your consultations in one place. When you take on a service, the same account becomes your client dashboard — projects, approvals and reporting."
      statement="One account, from first call to monthly report."
      readings={READINGS}
      foot={
        <>
          Creating an account costs nothing and commits you to nothing. Prefer to just talk?{" "}
          <Link
            href="/book"
            className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
          >
            Book a free consultation
          </Link>
          .
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
