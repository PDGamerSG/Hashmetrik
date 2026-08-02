import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Route changes are crossfaded by React's <ViewTransition>; the animation
     itself is in globals.css under "Page transitions". */
  experimental: {
    viewTransition: true,
    /* The site and `/admin` are separate root layouts, so an unmatched URL has
       no layout to render a 404 into and Next falls back to its own bare page.
       This hands that case to `app/global-not-found.tsx`. */
    globalNotFound: true,

    /* Turbopack's filesystem cache is on by default for `next dev` as of 16.1,
       and it is left on: a healthy cache is what makes a restart cost under a
       second instead of ten.

       It can degrade, though, and the failure is loud rather than slow. The
       store under `.next/dev/cache/turbopack` grows — half a gigabyte, with
       single `.sst` files in the hundreds of megabytes — and the dev server
       then pins several cores and climbs past 4GB of RSS *while completely
       idle*: no requests, no file changes, nothing in the log after the first
       compile. Once it is in that state it does not recover on its own.

       The cure is to throw the cache away — `npm run dev:clean`, which is
       `next dev` with `.next` removed first. A fresh cache sits at zero CPU.
       If it turns out to recur often enough to be a tax, uncommenting this
       trades those fast restarts for never seeing it again:

         turbopackFileSystemCacheForDev: false, */
  },
};

export default nextConfig;
