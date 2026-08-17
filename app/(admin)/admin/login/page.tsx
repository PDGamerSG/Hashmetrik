import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";
import { AuthShell, type Reading } from "@/components/site/auth-shell";
import { optionalSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Sign in — Hashmetrik",
  robots: { index: false, follow: false },
};

/* Nothing here is cacheable: the answer depends on the caller's cookie. */
export const dynamic = "force-dynamic";

/* The staff side of the same list the client login shows — the two halves of
   one product, described from the two ends. */
const READINGS: readonly Reading[] = [
  {
    label: "Leads and consultations",
    note: "Everything that came in from the site, who it is with, and what happens next.",
  },
  {
    label: "Clients and projects",
    note: "Activate an account, set the scope, and move the work through its milestones.",
  },
  {
    label: "Reporting",
    note: "Publish the month's numbers to the people they belong to.",
  },
];

export default async function LoginPage() {
  /* `proxy.ts` already bounces a signed-in visitor away from this page, but it
     only sees whether a cookie exists. This is the check that knows whether it
     is a valid one. */
  if (await optionalSession()) redirect("/admin");

  return (
    <AuthShell
      title="Staff sign-in"
      lede="For the Hashmetrik team. Accounts are created from the command line, not from this page."
      statement="The desk behind the studio."
      readings={READINGS}
      foot={
        <>
          Not staff? The client sign-in is at{" "}
          <Link
            href="/login"
            className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
          >
            /login
          </Link>
          .
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
