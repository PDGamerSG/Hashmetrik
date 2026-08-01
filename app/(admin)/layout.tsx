import type { Metadata, Viewport } from "next";
import "../globals.css";
import { fontVariables } from "@/lib/fonts";

/**
 * The admin root layout.
 *
 * Deliberately bare next to the site's: no smooth scroll, no intro, no
 * masthead, no chat bubble. This is a working surface that somebody keeps open
 * while they call people back, and every piece of marketing motion in the way
 * of that is a cost with no return. It keeps the site's type and colour so it
 * still reads as the same company.
 */
export const metadata: Metadata = {
  title: "Admin — HashMetrik",
  /* Belt and braces with `app/robots.ts`: a page behind a login should not be
     indexed even if it is ever served to a crawler by mistake. */
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f3ec",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="flex min-h-dvh flex-col bg-bone antialiased">{children}</body>
    </html>
  );
}
