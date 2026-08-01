/**
 * Window arithmetic for the rate limiter, kept pure so it can be tested with a
 * fixed clock.
 *
 * Fixed windows rather than a sliding log: a sliding window needs a row per
 * request, and this limiter exists to keep a free-tier API key from being
 * drained, not to shape traffic precisely. The known cost is that a client can
 * spend a full allowance either side of a boundary; at thirty messages an hour
 * that is sixty in a burst, which is still nothing.
 */
export const WINDOW_MS = 60 * 60 * 1000;

/** Identifies the current window — the hour, as an ISO prefix. */
export function windowKey(now: Date = new Date()): string {
  return new Date(Math.floor(now.getTime() / WINDOW_MS) * WINDOW_MS).toISOString();
}

/** Windows older than this are dead weight and get swept. */
export function isStale(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() > WINDOW_MS * 2;
}

/**
 * The caller's IP, from the proxy headers Vercel sets.
 *
 * `x-forwarded-for` is a list appended to by each hop, and the first entry is
 * the client. Falls back to a shared bucket rather than to no limit at all,
 * because a request with no usable address is the one most worth capping.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
