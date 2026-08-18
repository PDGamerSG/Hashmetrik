"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { scrollToElement } from "@/components/motion/motion-root";

/**
 * A link to a section of the home page that does not put a fragment in the
 * address bar.
 *
 * The `href` is still written as `/#services`, so a crawler, a middle-click
 * and a visitor with JavaScript off all get a working anchor. What changes is
 * the click: the section is scrolled to directly, and the URL stays the clean
 * one the visitor arrived on.
 */

const TARGET_KEY = "hm:section";

function sectionOf(href: string) {
  const [path, hash] = href.split("#");
  /* Only same-site anchors into the home page are handled here. */
  return hash && (path === "/" || path === "") ? hash : null;
}

function scrollToSection(id: string) {
  /* Deferred by two frames: the click that closes the mobile menu also
     releases the scroll lock, and a clamped root cannot be scrolled at all. */
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = document.getElementById(id);
      /* No masthead clearance is passed. That number is declared once, as
         `scroll-padding-top` in `globals.css`, and the browser subtracts it
         when it resolves an element — exactly as it does for a native anchor.
         Passing it again here landed every section a second masthead below
         the bar. */
      if (target) scrollToElement(target);
    }),
  );
}

export function SectionLink({
  href,
  children,
  onClick,
  ...rest
}: {
  href: string;
  children: ReactNode;
} & Omit<ComponentProps<typeof Link>, "href" | "children">) {
  const pathname = usePathname();
  const router = useRouter();
  const section = sectionOf(href);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (!section || event.defaultPrevented) return;
    /* Leave modified clicks alone — those are "open in a new tab", and the
       anchored URL is the right thing to hand the new tab. */
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    if (pathname === "/") {
      scrollToSection(section);
      return;
    }

    /* From another page: go home first, and let the home page pick the
       section up on arrival. */
    sessionStorage.setItem(TARGET_KEY, section);
    router.push("/");
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

/**
 * Mounted on the home page: scrolls to whichever section sent us here.
 * Renders nothing.
 */
export function SectionScroll() {
  useEffect(() => {
    const section = sessionStorage.getItem(TARGET_KEY);
    if (!section) return;
    sessionStorage.removeItem(TARGET_KEY);
    scrollToSection(section);
  }, []);

  return null;
}
