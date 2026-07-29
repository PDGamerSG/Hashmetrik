import { Section, SectionHead, Accent } from "@/components/site/section";
import { Reveal } from "@/components/motion/reveal";
import { REASONS } from "@/lib/content";

export function Why() {
  return (
    <Section id="why" reading="04" label="Why us">
      <div className="py-20 md:py-28">
        <SectionHead
          reading="04"
          eyebrow="Why us"
          title={
            <>
              A boutique practice, <Accent>on purpose</Accent>.
            </>
          }
          desc="Small enough that the people who pitched you are the people doing the work, and structured so you can always see what that work produced."
        />

        <Reveal
          as="ul"
          stagger={0.09}
          y={30}
          className="mt-14 grid gap-x-10 gap-y-12 md:mt-20 md:grid-cols-2"
        >
          {REASONS.map((reason, i) => (
            <li key={reason.title}>
              <div className="border-t-2 border-coral pt-5">
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tracking-[0.22em] tabular text-slate">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-xl leading-tight font-semibold tracking-[-0.025em] md:text-2xl">
                    {reason.title}
                  </h3>
                </div>
                <p className="mt-3 max-w-md pl-9 text-base leading-relaxed text-slate">
                  {reason.desc}
                </p>
              </div>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
