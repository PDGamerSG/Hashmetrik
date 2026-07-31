import { Accent } from "@/components/site/section";
import { MarkField } from "@/components/site/mark-field";
import { ActionLink } from "@/components/site/button";
import { Overslide, OverslidePanel } from "@/components/motion/overslide";
import { SplitHeading } from "@/components/motion/split-heading";
import { Reveal } from "@/components/motion/reveal";
import { InView, InViewList } from "@/components/motion/in-view";
import { Magnetic } from "@/components/motion/magnetic";
import { ImageZoom } from "@/components/motion/image-zoom";
import { PILLARS } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * The growth package — the homepage's central claim, given the page's spine.
 *
 * The argument is that these four pillars are *one* purchase, so presenting
 * them as a four-up grid would undercut the copy: a grid says "pick one".
 * They are laid down instead, each pillar pinning itself to the viewport
 * while the next one rides up over it, so by the fourth panel the visitor has
 * watched a package accumulate rather than read a menu.
 *
 * Tones alternate ink and bone. That is not decoration either — the covered
 * panel is dimmed towards ink as it recedes, and alternating means the panel
 * arriving is always the opposite value to the one it is covering, so each
 * transition has contrast to work with.
 */
export function GrowthPackage() {
  return (
    <section id="package" className="relative">
      <Intro />

      <Overslide>
        {PILLARS.map((pillar, i) => (
          <Panel key={pillar.id} pillar={pillar} dark={i % 2 === 0} />
        ))}
      </Overslide>

      <Close />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Intro() {
  return (
    <div className="relative overflow-hidden bg-bone text-ink">
      <MarkField className="pointer-events-none absolute inset-0 text-ink" />

      <div className="shell relative py-20 md:py-28">
        <div className="flex items-center gap-3 label tabular text-slate">
          <span>01</span>
          <span aria-hidden className="h-px w-6 bg-current opacity-40" />
          <span className="text-coral">Growth solution</span>
        </div>

        <SplitHeading
          as="h2"
          className="mt-5 max-w-4xl font-display text-[clamp(2rem,5.5vw,3.75rem)] leading-[1] font-medium tracking-[-0.018em] text-balance"
        >
          One customised growth package. Four pillars, priced as one.
        </SplitHeading>

        <Reveal className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-16">
          <p className="max-w-xl text-base leading-relaxed text-slate md:text-lg">
            Not a menu of retainers. We take the four things a brand actually needs — an identity,
            somewhere to send people, demand, and reach — and size the mix to your stage, your
            margin and the quarter in front of you.
          </p>

          {/* The contents page for the stack below. It doubles as the fallback
              on phones, where the panels are an ordinary column. */}
          <ul className="grid gap-px self-end border-y border-ash bg-ash">
            {PILLARS.map((pillar) => (
              <li
                key={pillar.id}
                className="flex items-baseline gap-4 bg-bone py-3 label"
              >
                <span className="tabular text-coral">{pillar.reading}</span>
                <span className="flex-1 text-ink">{pillar.name}</span>
                <span className="tabular text-slate">{pillar.items.length} deliverables</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Panel({ pillar, dark }: { pillar: (typeof PILLARS)[number]; dark: boolean }) {
  return (
    <OverslidePanel className={dark ? "bg-ink text-bone" : "bg-bone text-ink"}>
      <MarkField className={cn("pointer-events-none absolute inset-0", dark ? "text-bone" : "text-ink")} />

      <div className="shell relative grid items-center gap-10 py-16 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:gap-14 md:py-0 lg:gap-20">
        <div>
          {/* Both readings are set in the wide-tracked mono, which is why the
              row wraps rather than shrinks on a phone: at 0.28em of letter
              spacing there is no width left to give back. The rule between
              them is a separator, so it goes when they stop sharing a line. */}
          <InView className="flex flex-wrap items-center gap-x-4 gap-y-1" y={12}>
            {/* A sub-scale: these four are readings *within* section 01, not
                four more sections. Writing the denominator says so. */}
            <span className="label tabular text-coral">
              Pillar {pillar.reading} / {String(PILLARS.length).padStart(2, "0")}
            </span>
            <span
              aria-hidden
              className={cn("hidden h-px w-10 sm:block", dark ? "bg-bone/30" : "bg-ash")}
            />
            <span
              className={cn(
                "label tabular",
                dark ? "text-bone/50" : "text-slate",
              )}
            >
              Measured on {pillar.code}
            </span>
          </InView>

          <InView delay={0.05}>
            <h3 className="mt-5 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] font-medium tracking-[-0.022em] text-balance">
              {pillar.name}
            </h3>
            <p
              className={cn(
                "mt-4 max-w-md text-base leading-relaxed md:text-lg",
                dark ? "text-bone/65" : "text-slate",
              )}
            >
              {pillar.claim}
            </p>
          </InView>

          {/* The deliverables, arriving one at a time as the panel lands.
              Two columns from `sm` up: at six items a single column runs past
              the fold on a laptop and the panel stops being a panel. */}
          <InViewList
            className={cn(
              "mt-8 grid gap-x-8 gap-y-px border-t sm:grid-cols-2 md:mt-10",
              dark ? "border-ash-ink" : "border-ash",
            )}
            itemClassName={cn(
              "flex items-center gap-3 border-b py-2.5 text-sm md:text-base",
              dark ? "border-ash-ink text-bone/85" : "border-ash text-ink/85",
            )}
            items={pillar.items.map((item) => ({
              key: item,
              content: (
                <>
                  <span aria-hidden className="h-px w-4 shrink-0 bg-gold" />
                  {item}
                </>
              ),
            }))}
          />
        </div>

        <InView delay={0.12} amount={0.2} className="relative w-full">
          {/* A pinned panel holds the viewport for several seconds, which is
              the one condition under which a loop earns its bandwidth: the
              plate has time to be watched rather than passed — and the one
              place where a visitor might want the photograph at full size,
              which is what the loupe and the lightbox are for. */}
          {/* The clip plays on a phone here, unlike in the hero. Below `md`
              these panels are a single column, so exactly one plate is ever on
              screen and the observer inside `PlateVideo` has paused the last
              one before the next begins — one decoder, not four. This is the
              page's main moving image on a handset. */}
          <ImageZoom
            src={pillar.image}
            video={pillar.video}
            videoOnPhone
            alt={pillar.imageAlt}
            caption={`${pillar.reading} — ${pillar.name}`}
            sizes="(max-width: 768px) 100vw, 44vw"
            zoomClassName="aspect-4/5 h-[82dvh] w-auto max-w-full"
            className="aspect-4/3 md:aspect-4/5 md:max-h-[62dvh]"
          />
          {/* The reading, burned into the corner of the plate. Transparent to
              the pointer, or it would punch a hole in the zoom target. */}
          <span className="pointer-events-none absolute bottom-4 left-4 rounded-sheet bg-ink/70 px-3 py-1.5 label-sm tabular text-bone backdrop-blur-sm">
            {pillar.reading} — {pillar.name}
          </span>
        </InView>
      </div>
    </OverslidePanel>
  );
}

/* -------------------------------------------------------------------------- */

function Close() {
  return (
    <div className="relative overflow-hidden bg-bone text-ink">
      <MarkField className="pointer-events-none absolute inset-0 text-ink" />

      <Reveal className="shell relative flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
        <p className="max-w-xl font-display text-2xl leading-tight font-medium tracking-[-0.018em] text-balance md:text-3xl">
          Four pillars, <Accent>one invoice</Accent>, one team accountable for the number at the
          end of it.
        </p>
        <Magnetic className="w-full md:w-auto">
          <ActionLink href="/book" size="lg" className="w-full">
            Build my package
          </ActionLink>
        </Magnetic>
      </Reveal>
    </div>
  );
}
