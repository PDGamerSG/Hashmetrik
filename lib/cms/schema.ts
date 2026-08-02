/**
 * Content types and slugs.
 *
 * Free of `server-only` and Prisma on purpose: this is the part worth testing,
 * and it should be runnable by `node --test` without a database behind it —
 * the same split as `lib/leads/schema.ts` against `lib/leads/store.ts`.
 */

export const CONTENT_TYPES = ["page", "blog", "case_study", "faq", "service"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && (CONTENT_TYPES as readonly string[]).includes(value);
}

/**
 * Lower case, hyphens, nothing that needs escaping in a URL.
 *
 * Everything outside `a-z0-9` is replaced rather than encoded, which is what
 * lets the result be interpolated straight into a path. It can reduce to an
 * empty string — "!!!" has nothing left — so callers have to check.
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
