import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

/**
 * The root layout for everything behind a sign-in, and for the two forms that
 * get you there.
 *
 * Deliberately bare next to the marketing site's: no scroll-driven motion, no
 * intro, no masthead, no chat bubble. These are working surfaces somebody keeps open
 * while they do a job, and every piece of marketing motion in the way of that
 * is a cost with no return.
 *
 * Same brand tokens as the public site — bone, ink, coral, gold — carried
 * through a conventional light dashboard rather than the site's own printed
 * layout.
 */
export const metadata: Metadata = {
  title: { default: "Hashmetrik", template: "%s — Hashmetrik" },
  /* A signed-in surface should not be indexed even if it is ever served to a
     crawler by mistake. `app/robots.ts` says the same thing again. */
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f0",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-bone text-ink antialiased">{children}</body>
    </html>
  );
}
