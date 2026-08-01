import { ActionLink } from "@/components/site/button";
import { MarkField } from "@/components/site/mark-field";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-bone">
      <MarkField className="pointer-events-none absolute inset-0 text-ink" />
      <div className="shell relative flex min-h-[70vh] flex-col justify-center py-20">
        <p className="label text-coral">Error 404</p>
        <h1 className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,8vw,6rem)] leading-[0.94] font-medium tracking-[-0.025em]">
          Nothing measured{" "}
          <em className="font-editorial font-normal tracking-[-0.012em] text-coral">here</em>.
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
