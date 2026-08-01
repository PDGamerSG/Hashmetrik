import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { optionalSession } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "Sign in — HashMetrik",
  robots: { index: false, follow: false },
};

/* Nothing here is cacheable: the answer depends on the caller's cookie. */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  /* `proxy.ts` already bounces a signed-in visitor away from this page, but it
     only sees whether a cookie exists. This is the check that knows whether it
     is a valid one. */
  if (await optionalSession()) redirect("/admin");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="label-sm text-slate">HashMetrik</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
          Admin
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Staff accounts only. They are created from the command line, not here.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
