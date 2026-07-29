import type { Metadata } from "next";
import { BookingFlow } from "@/components/book/booking-flow";

export const metadata: Metadata = {
  title: "Book a free consultation",
  description:
    "Book a free 30-minute growth consultation with a senior HashMetrik strategist. Pick a service, choose a slot, and get a written growth thesis within 48 hours.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <section className="relative overflow-hidden bg-bone">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />

      {/* No hero here on purpose. Everyone arriving on this page has already
          decided to book, so the first step has to be the first thing they
          see — the page states itself in one line and gets out of the way. */}
      <div className="shell relative flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-ash pt-[clamp(1rem,2.6vh,1.5rem)] pb-4">
        <h1 className="font-display text-2xl leading-tight font-semibold tracking-[-0.035em] md:text-3xl">
          Book a free consultation
        </h1>
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate">
          30 minutes · <span className="text-coral">free</span> · no obligation
        </p>
      </div>

      <div className="shell relative">
        <BookingFlow />
      </div>
    </section>
  );
}
