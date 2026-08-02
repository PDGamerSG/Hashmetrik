import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, type Reading } from "@/components/site/auth-shell";
import { SubmitButton, formatDate } from "@/components/app/ui";
import { currentViewer } from "@/lib/auth/dal";
import { homeFor } from "@/lib/auth/gate";
import { CONTACT } from "@/lib/content";
import { logout } from "../actions";

export const metadata: Metadata = { title: "Account suspended" };
export const dynamic = "force-dynamic";

/**
 * Where a suspended account lands.
 *
 * This page is the one end of a loop that would otherwise have no end. A
 * suspended user still holds a valid session, so `proxy.ts` reads them as signed
 * in and turns them away from `/login`; every gated page turns them away too.
 * A page that is neither gated nor an auth page is the only place both ends
 * agree on, which is why the check here is `currentViewer()` and not
 * `verifySession()` — asking the guard that redirects here would redirect here.
 *
 * It also has the only two things a person in this state can use: what happened,
 * and who to ask about it.
 */
const READINGS: readonly Reading[] = [
  {
    label: "Nothing is deleted",
    note: "Your projects, approvals and reports are exactly where you left them.",
  },
  {
    label: "It is reversible",
    note: "An administrator can restore the account, and everything comes back with it.",
  },
];

export default async function SuspendedPage() {
  const viewer = await currentViewer();

  /* Signed out entirely — the login form is the right page, not this one. */
  if (!viewer) redirect("/login");

  /* Restored while the tab was open, or never suspended and typing URLs. */
  if (!viewer.suspendedAt) redirect(homeFor(viewer));

  return (
    <AuthShell
      title="Account suspended"
      lede={`Access to ${viewer.email} was suspended on ${formatDate(viewer.suspendedAt)}. Nothing has been deleted.`}
      statement="Paused, not lost."
      readings={READINGS}
      foot={
        <>
          Think this is a mistake?{" "}
          <Link
            href={`mailto:${CONTACT.email}`}
            className="text-ink underline decoration-ash underline-offset-4 transition-colors hover:decoration-coral"
          >
            {CONTACT.email}
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-sm leading-relaxed text-slate">
          While an account is suspended its dashboard, projects and reports are closed. Sign out
          here if you are on a shared machine — signing back in will return you to this page until
          the suspension is lifted.
        </p>
        <form action={logout}>
          <SubmitButton>Sign out</SubmitButton>
        </form>
      </div>
    </AuthShell>
  );
}
