import { Section, SectionHead, Accent } from "@/components/site/section";
import { ActionLink } from "@/components/site/button";
import { SERVICES } from "@/lib/content";

/**
 * Services as a spec sheet rather than six identical cards.
 *
 * Each row is led by the reading that service is measured on — SOV for PR,
 * ROAS for performance — which is the honest way to index this list: you
 * pick the service by the number you need to move.
 */
export function Services() {
  return (
    <Section id="services" reading="03" label="Services" tone="ink">
      <div className="py-20 md:py-28">
        <SectionHead
          reading="03"
          eyebrow="Services"
          tone="ink"
          title={
            <>
              Six levers, <Accent>one system</Accent>.
            </>
          }
          desc="Run together rather than sold separately, because the channels only compound when they share a strategy and a definition of success."
        />

        <ul className="mt-14 border-t border-ash-ink md:mt-20">
          {SERVICES.map((service) => (
            <li key={service.id} className="reveal">
              <article className="group grid gap-6 border-b border-ash-ink py-8 transition-colors duration-300 hover:bg-bone/[0.03] md:grid-cols-[7rem_minmax(0,1.1fr)_minmax(0,1fr)] md:items-start md:gap-10 md:py-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] tabular text-coral">
                  {service.code}
                </p>

                <div>
                  <h3 className="font-display text-2xl leading-tight font-semibold tracking-[-0.03em] md:text-3xl">
                    {service.name}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-bone/55 md:text-base">
                    {service.problem}
                  </p>
                </div>

                <ul className="space-y-2.5">
                  {service.outcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-3 text-sm text-bone/85">
                      <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-gold" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-bone/55">
            Not sure which lever you need? That is what the consultation is for.
          </p>
          <ActionLink href="/book" variant="gold" className="w-fit">
            Book a free consultation
          </ActionLink>
        </div>
      </div>
    </Section>
  );
}
