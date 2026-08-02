import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { listPublished } from "@/lib/cms/store";

/**
 * The static pages, plus whatever the CMS has published.
 *
 * A database failure here must not take the sitemap down — a crawler that gets
 * a 500 drops the whole file, and the four fixed pages are the ones that matter
 * most.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const updated = new Date();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, changeFrequency: "weekly", priority: 1, lastModified: updated },
    { url: `${SITE.url}/book`, changeFrequency: "weekly", priority: 0.9, lastModified: updated },
    { url: `${SITE.url}/contact`, changeFrequency: "monthly", priority: 0.7, lastModified: updated },
    { url: `${SITE.url}/links`, changeFrequency: "monthly", priority: 0.6, lastModified: updated },
  ];

  const [posts, cases] = await Promise.all([
    listPublished("blog").catch(() => []),
    listPublished("case_study").catch(() => []),
  ]);

  const entries = [...posts, ...cases];
  if (entries.length === 0) return fixed;

  return [
    ...fixed,
    {
      url: `${SITE.url}/insights`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      lastModified: updated,
    },
    ...entries.map((entry) => ({
      url: `${SITE.url}/insights/${entry.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      lastModified: entry.publishedAt ?? updated,
    })),
  ];
}
