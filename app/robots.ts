import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    /* Everything behind a sign-in, plus `/api`, which answers nothing a crawler
       can use. Listed so none of them shows up as a broken result — the pages
       themselves also send `robots: noindex` from their layouts. */
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/team", "/login", "/signup", "/api"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
