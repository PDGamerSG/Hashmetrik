import { Tape } from "@/components/site/tape";
import { HeroField } from "./hero-field";
import { HeroLead } from "./hero-lead";
import { HeroLight } from "./hero-light";
import { HeroPlates } from "./hero-plates";

/**
 * The opening screen.
 *
 * One claim in the middle of a full viewport, with the studio's own frames
 * flying around it. It was a two-column layout before — headline left, intake
 * panel right, a tidy row of three photographs underneath — which is a
 * perfectly good page and reads as a brochure. The argument for the change is
 * the argument the copy makes: this is one partner, not a set of columns.
 *
 * Everything decorative here is a layer of the same field:
 *
 * - `HeroField` — the loose measurement marks, drifting on a canvas.
 * - `HeroLight` — the window light, sweeping in and then following the pointer.
 * - the grain — the ruled paper they came off.
 * - `HeroPlates` — the work itself, cut loose from its contact sheet.
 *
 * The height is a screen *minus the masthead* — the bar is sticky and sits
 * over the hero, so a plain `100svh` would push the tape and the scroll cue a
 * masthead's worth below the fold and lose the one edge that says the page
 * continues. `svh` rather than `vh` for the same reason at the other end: a
 * phone with a retracting URL bar must not open with its CTA underneath it.
 */
export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden bg-bone md:min-h-[calc(100svh-5rem)]">
      <HeroField className="pointer-events-none absolute inset-0 h-full w-full" />
      {/* Under the grain on purpose: the light falls on the paper, so the
          paper's own texture has to sit over it. */}
      <HeroLight />
      <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />

      <HeroPlates />

      <div className="shell relative z-10 flex flex-1 items-center justify-center py-14 md:py-16">
        <HeroLead />
      </div>

      <ScrollCue />

      <Tape />
    </section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The invitation to keep going.
 *
 * A mark travelling down a short rule — the same vocabulary as everything else
 * on the page, at the smallest size it survives. `aria-hidden`, because
 * "scroll" is not an instruction anyone needs read aloud, and pure CSS, so it
 * costs nothing and runs before hydration.
 */
function ScrollCue() {
  return (
    <div
      aria-hidden
      className="relative z-10 hidden flex-col items-center gap-2.5 pb-6 md:flex"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate">Scroll</span>
      <span className="relative block h-8 w-px overflow-hidden bg-ash">
        <span className="cue-mark absolute inset-x-0 top-0 block h-3 bg-coral" />
      </span>
    </div>
  );
}
