import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/app/auth-forms";
import { optionalSession } from "@/lib/auth/dal";
import { homeFor } from "@/lib/auth/gate";

export const metadata: Metadata = { title: "Create an account" };

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await optionalSession();
  if (session) redirect(homeFor(session));

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <p className="label-sm text-slate">HashMetrik</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
          Create an account
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Track your consultations in one place. When you take on a service, the same account
          becomes your client dashboard — projects, approvals and reporting.
        </p>

        <div className="mt-8">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
