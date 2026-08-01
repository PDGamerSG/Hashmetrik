import { Section, SectionHead, Accent } from "@/components/site/section";
import { Reveal } from "@/components/motion/reveal";
import { Spotlight } from "@/components/motion/spotlight";
import { REASONS } from "@/lib/content";

/**
 * Why the practice is shaped the way it is.
 *
 * This was the one block on the homepage with nothing to press and nothing to
 * answer a pointer — four headings over four paragraphs, ruled in coral, and
 * finished. Every other section had already earned a response: the services
 * summon a plate, the audience cards tilt, the pillars pin themselves to the
 * screen. A page whose argument gets quieter exactly where it turns to *why
 * hire us* is a page that stops making the case at the point it matters most.
 *
 * So the claims are plates now. Three things happen on approach, all of them
 * cheap and none of them louder than the copy: a pool of light crosses the
 * card, the coral rule at the head of it extends, and the hairline around it
 * warms. The reading in the corner — PLAN, TEAM, AUDIT, FIT — files each claim
 * the way the pillars and the services are filed, so this reads as a
 * specification of the practice rather than a page of values.
 */
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
          className="mt-14 grid gap-4 md:mt-20 md:grid-cols-2 md:gap-5"
        >
          {REASONS.map((reason, i) => (
            <li
              key={reason.title}
              className="group relative overflow-hidden rounded-sheet border border-ash bg-bone-2/70 p-7 transition-colors duration-500 ease-[var(--ease-out-quint)] hover:border-coral/45 md:p-9"
            >
              <Spotlight />

              {/* The index, at the size it would be printed on the plate
                  itself rather than in the margin. Barely there — it is a
                  registration mark, and anything darker turns four claims into
                  four numbered steps, which is not what these are. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-3 right-3 font-display text-[7rem] leading-none font-medium tabular text-ink/[0.055] md:right-5 md:text-[8.5rem]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="relative flex items-center gap-3">
                {/* The rule extends on approach, from the same origin and on
                    the same curve as the wipe under a services row. One
                    gesture, spoken in two places. */}
                <span
                  aria-hidden
                  className="h-0.5 w-8 origin-left bg-coral transition-transform duration-500 ease-[var(--ease-out-quint)] group-hover:scale-x-[2.2] group-active:scale-x-[2.2]"
                />
                <span className="label tabular text-slate">{reason.code}</span>
              </div>

              <h3 className="relative mt-6 font-display text-xl leading-tight font-medium tracking-[-0.015em] md:text-2xl">
                {reason.title}
              </h3>
              <p className="relative mt-3 max-w-md text-base leading-relaxed text-slate">
                {reason.desc}
              </p>
            </li>
          ))}
        </Reveal>
      </div>
    </Section>
  );
}
