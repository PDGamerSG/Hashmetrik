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
  },
};

export default nextConfig;
