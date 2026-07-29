import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Route changes are crossfaded by React's <ViewTransition>; the animation
     itself is in globals.css under "Page transitions". */
  experimental: {
    viewTransition: true,
  },
  images: {
    // Editorial photography is served from Unsplash until the agency's own
    // shoot is ready; swap this block for the real asset host at that point.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
