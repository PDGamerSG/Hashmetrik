import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/app/auth-forms";
import { optionalSession } from "@/lib/auth/dal";
import { homeFor } from "@/lib/auth/gate";

export const metadata: Metadata = { title: "Sign in" };

/* Nothing here is cacheable: the answer depends on the caller's cookie. */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  /* `proxy.ts` already bounces a signed-in visitor away from this page. This is
     the same check with the database behind it, for the request that reached
     here without passing the proxy. */
  const session = await optionalSession();
  if (session) redirect(homeFor(session));

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <p className="label-sm text-slate">HashMetrik</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.015em] text-ink">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate">
          Your consultations, projects and reports live behind here.
        </p>

        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
