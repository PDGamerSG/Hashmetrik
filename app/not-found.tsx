import { ActionLink } from "@/components/site/button";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-bone">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />
      <div className="shell relative flex min-h-[70vh] flex-col justify-center py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-coral">Error 404</p>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.9] font-semibold tracking-[-0.045em]">
          Nothing measured{" "}
          <em className="font-editorial font-normal tracking-[-0.02em] text-coral">here</em>.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-slate">
          That page has moved or never existed. The work is all still on the homepage.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ActionLink href="/">Back to home</ActionLink>
          <ActionLink href="/contact" variant="outline" arrow={false}>
            Contact us
          </ActionLink>
        </div>
      </div>
    </section>
  );
}
