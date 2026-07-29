import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Route changes are crossfaded by React's <ViewTransition>; the animation
     itself is in globals.css under "Page transitions". */
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
