import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import NotFound from "./(site)/not-found";

/**
 * The 404 for a URL that matches no route at all.
 *
 * Needed because the app has two root layouts — the site and the admin area —
 * so an unmatched URL belongs to neither and Next.js has no layout to compose
 * a 404 from. Without this file it falls back to the framework's own bare page,
 * which is what happened the moment the admin root layout was added.
 *
 * It renders its own document for that reason, and reuses the section from
 * `(site)/not-found.tsx` so the two 404s — this one and the one a route throws
 * — stay the same page.
 */
export const metadata: Metadata = {
  title: "Page not found — Hashmetrik",
  description: "That page has moved or never existed.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-bone antialiased">
        <main className="flex-1">
          <NotFound />
        </main>
      </body>
    </html>
  );
}
