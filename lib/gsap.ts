"use client";

/**
 * One place where GSAP is configured.
 *
 * Plugins register themselves against the global timeline, so registering the
 * same plugin from six components is wasteful and — during fast refresh —
 * occasionally lossy. Everything imports the instance from here instead.
 *
 * Registration is guarded on `window` because client components are still
 * rendered once on the server, and ScrollTrigger measures the document the
 * moment it is registered.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* Every animation on this site is a transform or an opacity, so GSAP never
     needs to read a layout property back mid-tween. */
  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  /* A tab left in the background hands back one enormous delta on return.
     Without this the first frame after refocusing jumps every ScrollTrigger
     at once, which reads as a glitch rather than a catch-up. */
  gsap.ticker.lagSmoothing(200, 40);
}

export { gsap, ScrollTrigger, SplitText };
