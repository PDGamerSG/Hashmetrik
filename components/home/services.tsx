"use client";

import { Section, SectionHead, Accent } from "@/components/site/section";
import { ActionLink } from "@/components/site/button";
import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { CursorPreviewSurface, CursorPreviewTrigger } from "@/components/motion/cursor-preview";
import { SERVICES } from "@/lib/content";

/**
 * Services as a spec sheet rather than six identical cards.
 *
 * Each row is led by the reading that service is measured on — SOV for PR,
 * ROAS for performance — which is the honest way to index this list: you pick
 * the service by the number you need to move.
 *
 * The hover behaviour is the reason it can stay a list. A thumbnail in every
 * row would put six photographs on an ink surface and turn a legible index
 * into a gallery; instead the image is summoned under the pointer for the one
 * row being read, and the coral rule wipes across it from the left. Both are
 * enhancements — the row is a complete piece of information without either,
 * and on touch neither ever mounts.
 */
export function Services() {
  return (
    <Section id="services" reading="02" label="Services" tone="ink">
      <div className="py-20 md:py-28">
        <SectionHead
          reading="02"
          eyebrow="Services"
          tone="ink"
          title={
            <>
              Six levers, <Accent>one system</Accent>.
            </>
          }
          desc="Run together rather than sold separately, because the channels only compound when they share a strategy and a definition of success."
        />

        <CursorPreviewSurface>
          <ul className="mt-14 border-t border-ash-ink md:mt-20">
            {SERVICES.map((service) => (
              <CursorPreviewTrigger as="li" key={service.id} src={service.image}>
                <Reveal y={18} duration={0.8}>
                  <article className="group relative grid gap-6 overflow-hidden border-b border-ash-ink py-8 md:grid-cols-[7rem_minmax(0,1.1fr)_minmax(0,1fr)] md:items-start md:gap-10 md:py-10">
                    {/* The wipe. Scales from the left on approach and releases
                        to the right, so entering and leaving the row are
                        different gestures rather than the same fade twice. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-coral transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:origin-left group-hover:scale-x-100"
                    />

                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] tabular text-coral">
                      {service.code}
                    </p>

                    <div className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:translate-x-2">
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
                </Reveal>
              </CursorPreviewTrigger>
            ))}
          </ul>
        </CursorPreviewSurface>

        <Reveal className="mt-12 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-bone/55">
            Not sure which lever you need? That is what the consultation is for.
          </p>
          <Magnetic className="w-fit">
            <ActionLink href="/book" variant="gold" className="w-fit">
              Book a free consultation
            </ActionLink>
          </Magnetic>
        </Reveal>
      </div>
    </Section>
  );
}
