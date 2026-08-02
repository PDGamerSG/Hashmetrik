/**
 * Whether a stored link is one the browser may safely be handed.
 *
 * Every URL in this app is typed in by a person and rendered as an `href` for
 * somebody else to click — a deliverable for a client, a creative on a calendar.
 * `javascript:` and `data:` both parse as URLs and both execute on click, so
 * "does it parse" is not the question; the scheme is.
 *
 * Kept free of `server-only` and `next/*` so it can be checked at every point
 * that matters — on the way in, and again at render — and tested by
 * `node --test`. Both ends matter: validating only on write leaves any row
 * stored before the check existed still dangerous, and validating only at
 * render leaves the value in the database for the next thing that reads it.
 */
const SAFE = new Set(["http:", "https:"]);

export function isHttpUrl(value: string): boolean {
  try {
    return SAFE.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** The URL if it is safe to render, otherwise null. */
export function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return isHttpUrl(value) ? value : null;
}
