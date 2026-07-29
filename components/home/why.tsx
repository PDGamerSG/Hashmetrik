import { Section, SectionHead, Accent } from "@/components/site/section";
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

        <ul className="mt-14 grid gap-x-10 gap-y-12 md:mt-20 md:grid-cols-2">
          {REASONS.map((reason) => (
            <li key={reason.title} className="reveal">
              <div className="border-t-2 border-coral pt-5">
                <h3 className="font-display text-xl leading-tight font-semibold tracking-[-0.025em] md:text-2xl">
                  {reason.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-slate">{reason.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
