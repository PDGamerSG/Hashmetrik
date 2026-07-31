import type { Metadata, Viewport } from "next";
import { ViewTransition } from "react";
import { DM_Mono, Geist, Newsreader } from "next/font/google";
import "./globals.css";
import { Masthead } from "@/components/site/masthead";
import { Footer } from "@/components/site/footer";
import { Assistant } from "@/components/site/assistant";
import { Intro } from "@/components/site/intro";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { SITE } from "@/lib/content";

/* Display *and* editorial, from one family.
 *
 * This is a press office as much as a media buyer, and a serif says so before
 * a word of the copy is read. Newsreader carries an optical-size axis, so the
 * headline at 6rem is drawn with the fine joins and tight spacing of a
 * masthead while the same face at 1rem opens up and stays readable — the
 * difference a grotesk can only fake by adding weight.
 *
 * Its italic then does the editorial job that used to need a second serif.
 * One family for both means the emphasised word is a change of voice rather
 * than a change of typeface, which is the quieter and more expensive effect.
 */
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});

/* Text: a neutral grotesk with a tall x-height, deliberately without opinions.
   The display face is carrying the personality; running copy and interface
   labels only have to be legible at a glance and get out of the way. */
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/* Utility: every reading, code and tick label on the site. A drawn mono
   rather than a programmer's one — the readings are set as small caps in the
   margins of a document, not as source code in a terminal. */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
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
      className={`${newsreader.variable} ${geist.variable} ${dmMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-60 focus:label focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-bone"
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
