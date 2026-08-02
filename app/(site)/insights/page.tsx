import type { Metadata } from "next";
import Link from "next/link";
import { listPublished } from "@/lib/cms/store";

export const metadata: Metadata = {
  title: "Insights",
  description: "Writing and case studies from the HashMetrik team.",
};

/* Rebuilt on demand rather than at build time, so publishing something in the
   admin makes it live without a deploy. `revalidatePath` in the CMS action is
   what actually clears this. */
export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  /* Two queries rather than one on `type IN (...)`: they are rendered as two
     lists, and a single query would only be re-split afterwards. */
  const [posts, cases] = await Promise.all([
    listPublished("blog").catch(() => []),
    listPublished("case_study").catch(() => []),
  ]);

  const empty = posts.length === 0 && cases.length === 0;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-20 md:px-10 md:py-28">
      <p className="label-sm text-slate">HashMetrik</p>
      <h1 className="mt-3 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1] font-medium tracking-[-0.02em]">
        Insights
      </h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
        What we have learned running campaigns, and what it produced.
      </p>

      {empty ? (
        <p className="mt-16 text-sm leading-relaxed text-slate">
          Nothing published yet. Work is going up here shortly — in the meantime,{" "}
          <Link href="/book" className="text-ink underline underline-offset-2">
            book a consultation
          </Link>
          .
        </p>
      ) : (
        <>
          {cases.length > 0 && <Group title="Case studies" entries={cases} />}
          {posts.length > 0 && <Group title="Writing" entries={posts} />}
        </>
      )}
    </main>
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
    <section className="mt-16">
      <h2 className="label-sm text-slate">{title}</h2>
      <ul className="mt-6 border-t border-ash">
        {entries.map((entry) => (
          <li key={entry.slug} className="border-b border-ash">
            <Link href={`/insights/${entry.slug}`} className="group block py-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-xl font-medium tracking-[-0.015em] text-ink transition-colors group-hover:text-coral">
                  {entry.title}
                </h3>
                {entry.publishedAt && (
                  <time
                    dateTime={entry.publishedAt.toISOString()}
                    className="tabular text-xs text-slate"
                  >
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(entry.publishedAt)}
                  </time>
                )}
              </div>
              {entry.excerpt && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
                  {entry.excerpt}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
