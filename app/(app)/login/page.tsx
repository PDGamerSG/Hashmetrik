import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/app/auth-forms";
import { AuthShell, type Reading } from "@/components/site/auth-shell";
import { optionalSession } from "@/lib/auth/dal";
import { homeFor } from "@/lib/auth/gate";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = { title: "Sign in" };

/* Nothing here is cacheable: the answer depends on the caller's cookie. */
export const dynamic = "force-dynamic";

/* What is actually behind the login, in the order a client meets it. */
const READINGS: readonly Reading[] = [
  {
    label: "Consultations",
    note: "Every call you have booked, when it is, and what came out of the last one.",
  },
  {
    label: "Projects",
    note: "Scope, milestones and the approvals waiting on you, as the work moves.",
  },
  {
    label: "Reports",
    note: "The same set of numbers every month, so one month can be read against the next.",
  },
];

export default async function LoginPage() {
  /* `proxy.ts` already bounces a signed-in visitor away from this page. This is
     the same check with the database behind it, for the request that reached
     here without passing the proxy. */
  const session = await optionalSession();
  if (session) redirect(homeFor(session));

  return (
    <AuthShell
      title="Sign in"
      lede="Your consultations, projects and reports live behind here."
      statement="The work, and the numbers it moved."
      readings={READINGS}
      foot={
        <>
          Locked out, or never received an invitation?{" "}
          <Link
            href={`mailto:${CONTACT.email}`}
            className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
          >
            {CONTACT.email}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
