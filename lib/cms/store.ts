import "server-only";

import { prisma } from "@/lib/db";

import type { ContentType } from "./schema";

/**
 * Editable public content.
 *
 * The body is plain text, rendered as paragraphs. Nothing here is treated as
 * HTML anywhere, which is the whole reason an admin-editable field can be
 * published to a public page without a sanitiser standing between them.
 *
 * The types and the slug rule live in `schema.ts` so they can be tested without
 * a database — see the note there.
 */
export { CONTENT_TYPES, isContentType, toSlug, type ContentType } from "./schema";

export async function listContent(type?: string) {
  return prisma.cMSContent.findMany({
    where: type ? { type } : {},
    orderBy: [{ type: "asc" }, { updatedAt: "desc" }],
    take: 200,
  });
}

/** Published only — what the public site is allowed to see. */
export async function listPublished(type: ContentType) {
  return prisma.cMSContent.findMany({
    where: { type, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, coverUrl: true, publishedAt: true },
  });
}

export async function getPublished(slug: string) {
  return prisma.cMSContent.findFirst({
    where: { slug, publishedAt: { not: null } },
  });
}

export async function upsertContent(input: {
  id?: string;
  type: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  coverUrl?: string;
  published: boolean;
}) {
  const data = {
    type: input.type,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt || null,
    body: input.body,
    coverUrl: input.coverUrl || null,
  };

  if (input.id) {
    const existing = await prisma.cMSContent.findUnique({
      where: { id: input.id },
      select: { publishedAt: true },
    });
    return prisma.cMSContent.update({
      where: { id: input.id },
      data: {
        ...data,
        /* Publishing stamps the date once and keeps it. Re-saving a published
           page should not move it to the top of a date-ordered list. */
        publishedAt: input.published ? (existing?.publishedAt ?? new Date()) : null,
      },
    });
  }

  return prisma.cMSContent.create({
    data: { ...data, publishedAt: input.published ? new Date() : null },
  });
}

export async function deleteContent(id: string) {
  return prisma.cMSContent.delete({ where: { id }, select: { id: true } });
}
