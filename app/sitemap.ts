import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date();

  return [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1, lastModified: updated },
    { url: `${SITE.url}/book`, changeFrequency: "weekly", priority: 0.9, lastModified: updated },
    { url: `${SITE.url}/contact`, changeFrequency: "monthly", priority: 0.7, lastModified: updated },
    { url: `${SITE.url}/links`, changeFrequency: "monthly", priority: 0.6, lastModified: updated },
  ];
}
