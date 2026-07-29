import Image from "next/image";
import { Section, SectionHead, Accent } from "@/components/site/section";
import { AUDIENCES } from "@/lib/content";

export function Audiences() {
  return (
    <Section id="audiences" reading="02" label="Who we help">
      <div className="py-20 md:py-28">
        <SectionHead
          reading="02"
          eyebrow="Who we help"
          title={
            <>
              Eight kinds of business, <Accent>one method</Accent>.
            </>
          }
          desc="The playbook changes with the model. A clinic and a D2C brand do not have the same problem, and pretending otherwise is how retainers get wasted."
        />

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-20 md:gap-x-6 lg:grid-cols-4">
          {AUDIENCES.map((audience) => (
            <li key={audience.title} className="reveal group">
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-sheet bg-ash">
                <Image
                  src={audience.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 45vw, 22vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-4 border-t border-ash pt-3 transition-colors duration-300 group-hover:border-coral">
                <h3 className="font-display text-lg leading-tight font-semibold tracking-[-0.02em] md:text-xl">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{audience.problem}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
