import { DM_Mono, Geist, Newsreader } from "next/font/google";

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

/**
 * The three font variables, for the `<html>` element.
 *
 * Shared because there are now two root layouts — the site and the admin area —
 * and `next/font` keys its cache on the call site. Declaring the faces twice
 * would ship two copies of each and let them drift.
 */
export const fontVariables = `${newsreader.variable} ${geist.variable} ${dmMono.variable}`;
