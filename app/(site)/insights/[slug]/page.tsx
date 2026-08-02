import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublished } from "@/lib/cms/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getPublished(slug).catch(() => null);
  if (!entry) return { title: "Not found" };

  return {
    title: entry.title,
    description: entry.excerpt ?? undefined,
    openGraph: {
      title: entry.title,
      description: entry.excerpt ?? undefined,
      type: "article",
      publishedTime: entry.publishedAt?.toISOString(),
      images: entry.coverUrl ? [entry.coverUrl] : undefined,
    },
  };
}

export default async function InsightPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = await getPublished(slug).catch(() => null);

  /* Drafts and unknown slugs are the same answer on purpose: whether a URL is
     unpublished or was never written is not a public visitor's business. */
  if (!entry) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20 md:px-10 md:py-28">
      <Link href="/insights" className="label-sm text-slate underline underline-offset-4">
        Insights
      </Link>

      <h1 className="mt-6 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.02em]">
        {entry.title}
      </h1>

      {entry.publishedAt && (
        <time
          dateTime={entry.publishedAt.toISOString()}
          className="tabular mt-4 block text-xs text-slate"
        >
          {new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }).format(entry.publishedAt)}
        </time>
      )}

      {entry.excerpt && (
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate">{entry.excerpt}</p>
      )}

      {/* Split on blank lines and rendered as text nodes. The body is stored as
          plain text and never as HTML, which is what lets an admin-editable
          field reach a public page without a sanitiser in between. */}
      <div className="mt-10 space-y-5">
        {entry.body
          .split(/\n\s*\n/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed whitespace-pre-line text-ink">
              {paragraph}
            </p>
          ))}
      </div>

      <div className="mt-16 border-t border-ash pt-8">
        <Link href="/book" className="text-ink underline underline-offset-4">
          Book a consultation
        </Link>
      </div>
    </main>
  );
}
