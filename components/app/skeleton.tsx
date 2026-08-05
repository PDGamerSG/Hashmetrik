/**
 * What a signed-in page looks like while its data is still coming.
 *
 * Every page in these areas is `force-dynamic` and each one runs several
 * queries against a database that is not in the same country as most of the
 * people using it. Without a `loading.tsx` there is no boundary for Next to
 * paint at, so a click on a nav row held the *old* page on screen — unchanged,
 * for as long as the round trip took — and the sidebar was left looking like
 * the link had not registered. That is the whole of the "the buttons do
 * nothing" complaint on a slow connection.
 */
function Bar({ className }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-ash/70 ${className ?? ""}`} />;
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    /* Announced rather than silent: a screen reader gets one word about why
       nothing has arrived, instead of a page of empty boxes. */
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="border-b border-ash pb-6">
        <Bar className="h-9 w-64 max-w-full" />
        <Bar className="mt-3 h-4 w-80 max-w-full" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-ash bg-bone-2 px-4 py-5 shadow-sm md:px-5">
            <Bar className="h-3 w-20" />
            <Bar className="mt-4 h-7 w-16" />
            <Bar className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-4">
        <Bar className="h-4 w-28" />
        <div className="divide-y divide-ash overflow-hidden rounded-xl border border-ash bg-bone-2 shadow-sm">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4 md:px-5">
              <div className="min-w-0 flex-1">
                <Bar className="h-4 w-52 max-w-full" />
                <Bar className="mt-2 h-3 w-32" />
              </div>
              <Bar className="h-3 w-24 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
