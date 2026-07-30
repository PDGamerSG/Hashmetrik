import Image from "next/image";
import { Section, SectionHead, Accent } from "@/components/site/section";
import { Reveal } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { AUDIENCES } from "@/lib/content";

/**
 * Who the work is for.
 *
 * The cards tilt towards the pointer and carry a coral bloom on the edge
 * nearest it. Both are shallow on purpose: this is a grid of eight, and an
 * effect that reads as playful on one card reads as noise on eight. What the
 * tilt is actually doing is answering the pointer at all — on a grid this
 * regular, the only way to tell a card is a target is for it to move.
 */
export function Audiences() {
  return (
    <Section id="audiences" reading="03" label="Who we help">
      <div className="py-20 md:py-28">
        <SectionHead
          reading="03"
          eyebrow="Who we help"
          title={
            <>
              Eight kinds of business, <Accent>one method</Accent>.
            </>
          }
          desc="The playbook changes with the model. A clinic and a D2C brand do not have the same problem, and pretending otherwise is how retainers get wasted."
        />

        <Reveal
          as="ul"
          stagger={0.06}
          y={32}
          className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-20 md:gap-x-6 lg:grid-cols-4"
        >
          {AUDIENCES.map((audience) => (
            <li key={audience.title}>
              {/* The tilt is pointer-only, and Tailwind gates `group-hover`
                  behind `(hover: hover)`, so on a phone this card had no
                  response to a touch of any kind. `group-active` is the same
                  two moves — the plate pushes in, the rule under it turns
                  coral — played on the press instead of the approach. */}
              <TiltCard className="group h-full">
                <div className="relative aspect-4/5 w-full overflow-hidden rounded-sheet bg-ash">
                  <Image
                    src={audience.image}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 45vw, 22vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06] group-active:scale-[1.06]"
                  />
                </div>
                <div className="mt-4 border-t border-ash pt-3 transition-colors duration-300 group-hover:border-coral group-active:border-coral">
                  <h3 className="font-display text-lg leading-tight font-semibold tracking-[-0.02em] md:text-xl">
                    {audience.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{audience.problem}</p>
                </div>
              </TiltCard>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
