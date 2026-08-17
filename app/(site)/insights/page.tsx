import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { listPublished } from "@/lib/cms/store";
import { MarkField } from "@/components/site/mark-field";
import { Tape } from "@/components/site/tape";

export const metadata: Metadata = {
  title: "Insights",
  description: "Writing and case studies from the Hashmetrik team.",
};

/* Rebuilt on demand rather than at build time, so publishing something in the
   admin makes it live without a deploy. `revalidatePath` in the CMS action is
   what actually clears this. */
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function InsightsPage() {
  /* Two queries rather than one on `type IN (...)`: they are rendered as two
     lists, and a single query would only be re-split afterwards. */
  const [posts, cases] = await Promise.all([
    listPublished("blog").catch(() => []),
    listPublished("case_study").catch(() => []),
  ]);

  const total = posts.length + cases.length;

  return (
    <>
      {/* The same ruled sheet the contact page is printed on: this index used
          to be bare paper with a heading on it, which is the one page on the
          site that opted out of the site. */}
      <div className="relative overflow-hidden bg-bone">
        <MarkField className="pointer-events-none absolute inset-0 text-ink" />

        <section className="relative border-b border-ash">
          <div className="shell relative flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 pt-6 pb-5 md:pt-8 md:pb-6">
            <h1 className="font-display text-4xl leading-[1.02] font-medium tracking-[-0.022em] md:text-5xl">
              Insights
            </h1>
            <p className="label flex flex-wrap items-center gap-x-3 gap-y-2 text-slate">
              <span className="text-coral">
                {total === 0 ? "Publishing shortly" : `${total} published`}
              </span>
              <span aria-hidden className="hidden h-px w-8 bg-ash sm:block" />
              <span>What we learned, and what it produced</span>
            </p>
          </div>
        </section>

        <div className="shell relative py-14 md:py-20">
          {total === 0 ? (
            <div className="max-w-xl">
              <p className="font-display text-2xl leading-snug font-medium tracking-[-0.015em] text-ink text-balance">
                Nothing published yet.
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate">
                The first case studies are being written up. Until they are here, the fastest way
                to see how we work is to ask for the growth thesis — it is written for your
                business, and it is free.
              </p>
              <Link
                href="/book"
                className="label mt-8 inline-flex items-center gap-2 border-b border-ink pb-1 text-ink transition-colors hover:border-coral hover:text-coral"
              >
                Book a consultation
                <ArrowUpRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {cases.length > 0 && <Group title="Case studies" entries={cases} />}
              {posts.length > 0 && <Group title="Writing" entries={posts} />}
            </>
          )}
        </div>
      </div>

      <Tape />
    </>
  );
}

function Group({
  title,
  entries,
}: {
  title: string;
  entries: {
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
  }[];
}) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="flex items-center gap-4">
        <h2 className="label shrink-0 text-slate">{title}</h2>
        <span aria-hidden className="h-px flex-1 bg-ash" />
        <span className="tabular label-sm text-ink">{entries.length}</span>
      </div>

      {/* A ledger of pieces: the date in the margin, the title at reading
          weight, the excerpt under it. Rules between rather than cards around —
          this is an index, and an index is a list. */}
      <ul className="mt-6 border-t border-ash">
        {entries.map((entry) => (
          <li key={entry.slug} className="border-b border-ash">
            <Link
              href={`/insights/${entry.slug}`}
              className="group grid gap-x-8 gap-y-2 py-7 transition-colors md:grid-cols-[7.5rem_minmax(0,1fr)_1.5rem] md:py-8"
            >
              {entry.publishedAt ? (
                <time
                  dateTime={entry.publishedAt.toISOString()}
                  className="tabular label-sm pt-1.5 text-slate"
                >
                  {DATE.format(entry.publishedAt)}
                </time>
              ) : (
                <span aria-hidden />
              )}

              <div className="min-w-0">
                <h3 className="font-display text-2xl leading-tight font-medium tracking-[-0.018em] text-ink transition-colors group-hover:text-coral md:text-[1.75rem]">
                  {entry.title}
                </h3>
                {entry.excerpt && (
                  <p className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-slate">
                    {entry.excerpt}
                  </p>
                )}
              </div>

              <ArrowUpRight
                aria-hidden
                className="mt-2 hidden size-4 -translate-x-1 text-slate opacity-0 transition-all duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-0 group-hover:text-coral group-hover:opacity-100 md:block"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
