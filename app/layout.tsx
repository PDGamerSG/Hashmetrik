import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Inter_Tight,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Masthead } from "@/components/site/masthead";
import { Footer } from "@/components/site/footer";
import { Assistant } from "@/components/site/assistant";
import { Intro } from "@/components/site/intro";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SITE } from "@/lib/content";

/* Display: a grotesk with real width and optical-size axes, so headline sizes
   are drawn rather than merely scaled up. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

/* Editorial: high-contrast serif, italic only, one or two words at a time. */
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-instrument",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

/* Utility: every reading, code and tick label on the site. */
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
    <html
      lang="en"
      className={`${bricolage.variable} ${instrument.variable} ${interTight.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:rounded-sheet focus:bg-ink focus:px-4 focus:py-3 focus:font-mono focus:text-[11px] focus:tracking-[0.22em] focus:text-bone"
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
