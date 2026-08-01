import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    /* `/admin` is behind a login and `/api` answers nothing a crawler can use;
       both are listed so neither shows up as a broken result. */
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
