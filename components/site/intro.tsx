import Image from "next/image";

/**
 * The opening.
 *
 * A sheet of paper over the page that lifts once, while a reading counts up
 * from 000 to 100 — the site introducing itself in its own vocabulary rather
 * than with a spinner.
 *
 * Deliberately built without JavaScript. A loading screen is the one element
 * on a site that must never be able to get stuck: if it is driven by a bundle
 * and that bundle fails, the visitor is left staring at a blank sheet with no
 * way past it. Here the lift is a CSS animation with `forwards` fill, so it
 * happens whether or not React ever hydrates, and the counter is a CSS
 * `@property` interpolated as an integer rather than a state update per frame.
 *
 * Timing is shared with the hero through `--intro-duration` in `globals.css`,
 * which is where the hero's own entrance delay is read from too — the headline
 * begins the instant the sheet clears it, not on a guess.
 */
export function Intro() {
  return (
    <div className="intro" aria-hidden>
      <div className="intro-inner">
        <div className="intro-mark">
          <Image src="/logo-hm.png" alt="" width={64} height={64} className="size-8 rounded-sheet" />
          <span className="font-display text-2xl leading-[1.02] font-medium tracking-[-0.022em]">
            HashMetrik
          </span>
        </div>

        <div className="intro-meter">
          <span className="intro-fill" />
        </div>

        {/* The word carries the readout on its own where `@property` is not
            supported, since an unregistered custom property makes
            `counter-reset` invalid and the number simply does not print. */}
        <p className="intro-readout label tabular">
          Calibrating <span className="intro-count" />
        </p>
      </div>
    </div>
  );
}
