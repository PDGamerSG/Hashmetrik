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

/** The same block, unprinted on the console's ink rather than on the paper. */
function InkBlock({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`animate-pulse rounded-sheet bg-bone/10 ${className ?? ""}`} />
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    /* Announced rather than silent: a screen reader gets one word about why
       nothing has arrived, instead of a page of empty boxes. */
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* The console arrives at full strength and empty, so the page does not
          change shape when the numbers land — the frame is already the frame,
          and only the readings are missing. */}
      <div className="console-light relative overflow-hidden bg-ink px-5 pt-7 shadow-sheet md:px-8 md:pt-9">
        <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-5 pb-7 md:pb-8">
          <div className="min-w-0 flex-1">
            <InkBlock className="h-9 w-56 max-w-full" />
            <InkBlock className="mt-3.5 h-4 w-72 max-w-full" />
          </div>
          <InkBlock className="h-10 w-36 rounded-full" />
        </div>
        <div aria-hidden className="relative h-2.5 text-gold">
          <span className="absolute inset-x-0 bottom-0 h-px bg-ash-ink" />
          <span className="tick-scale absolute inset-x-0 bottom-0 h-1.5" />
          <span className="tick-scale-major absolute inset-x-0 bottom-0 h-2.5" />
        </div>
      </div>

      <div className="mt-12 space-y-3">
        <Block className="h-3 w-24" />
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="rounded-sheet border border-ash bg-bone-2 p-5 shadow-sheet md:p-6"
          >
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
