/**
 * What a signed-in page looks like while its data is still coming.
 *
 * Every page in these areas is `force-dynamic` and each one runs several
 * queries against a database that is not in the same country as most of the
 * people using it. Without a `loading.tsx` there is no boundary for Next to
 * paint at, so a click on a nav pill held the *old* page on screen — unchanged,
 * for as long as the round trip took — and the bar was left looking like the
 * link had not registered. That is the whole of the "the buttons do nothing"
 * complaint on a slow connection.
 *
 * Deliberately not a shimmer. The site's material is paper, and a gradient
 * sweeping across a page is the one animation that would say "web app" instead.
 * These are blank ruled blocks that fade gently, which is what an unprinted
 * sheet looks like.
 */
function Block({ className }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-sheet bg-ash/60 ${className ?? ""}`} />;
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    /* Announced rather than silent: a screen reader gets one word about why
       nothing has arrived, instead of a page of empty boxes. */
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-ash pb-6">
        <div className="min-w-0 flex-1">
          <Block className="h-9 w-56 max-w-full" />
          <Block className="mt-3 h-4 w-72 max-w-full" />
        </div>
        <Block className="h-10 w-36 rounded-full" />
      </div>

      <div className="mt-8 space-y-3">
        <Block className="h-3 w-24" />
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="rounded-sheet border border-ash bg-bone-2 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <Block className="h-4 w-48 max-w-full" />
              <Block className="h-6 w-24 rounded-full" />
            </div>
            <Block className="mt-4 h-3 w-full" />
            <Block className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
