import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import "../globals.css";
import { Masthead } from "@/components/site/masthead";
import { Footer } from "@/components/site/footer";
import { Assistant } from "@/components/site/assistant";
import { Intro } from "@/components/site/intro";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SITE } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";

/**
 * The public site's root layout.
 *
 * A group root rather than `app/layout.tsx` because `/admin` needs a document
 * of its own: the intro animation, Lenis, the masthead and the chat bubble are
 * all right for a marketing page and all wrong over a table of leads. Two root
 * layouts is how Next.js does that; the cost is a full page load when crossing
 * between them, which is a boundary nobody crosses mid-task.
 *
 * The faces moved to `lib/fonts.ts` when the second root arrived — see there.
 */

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "HashMetrik — PR & digital marketing agency in Hyderabad",
    template: "%s — HashMetrik",
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "HashMetrik — measurable growth, not guesswork",
    description: SITE.description,
    url: SITE.url,
    images: ["/icon-512.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "HashMetrik — measurable growth, not guesswork",
    description: SITE.description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-70 focus:label focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-bone"
        >
          Skip to content
        </a>
        <Intro />
        {/* Lenis wraps the whole document rather than the main column: the
            masthead's scroll readout, every ScrollTrigger and the overslide
            stack all have to be reading the same scroll position. */}
        <SmoothScroll>
          <Masthead />
          {/* Only the page body crossfades between routes. The masthead is
              held still by name — see `::view-transition-group(masthead)`. */}
          <ViewTransition>
            <main id="main" className="flex-1">
              {children}
            </main>
          </ViewTransition>
          <Footer />
        </SmoothScroll>
        <Assistant />
      </body>
    </html>
  );
}
