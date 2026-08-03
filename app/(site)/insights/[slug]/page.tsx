import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPublished } from "@/lib/cms/store";
import { safeUrl } from "@/lib/url";

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

  const cover = safeUrl(entry.coverUrl);
  const paragraphs = entry.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  /* Printed against the piece, not guessed at by a word count that would have
     to agree with itself twice. Roughly 220 words a minute, rounded up. */
  const minutes = Math.max(1, Math.round(entry.body.split(/\s+/).length / 220));

  return (
    <article className="flex-1">
      <header className="border-b border-ash">
        <div className="mx-auto w-full max-w-3xl px-6 pt-10 pb-12 md:px-10 md:pt-14 md:pb-16">
          <Link
            href="/insights"
            className="label-sm group inline-flex items-center gap-2 text-slate transition-colors hover:text-ink"
          >
            <ArrowLeft
              aria-hidden
              className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:-translate-x-0.5"
            />
            Insights
          </Link>

          <h1 className="mt-7 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.02em] text-balance">
            {entry.title}
          </h1>

          {entry.excerpt && (
            <p className="mt-6 max-w-2xl font-editorial text-lg leading-relaxed text-slate italic md:text-xl">
              {entry.excerpt}
            </p>
          )}

          <p className="label-sm mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-slate">
            {entry.publishedAt && (
              <time dateTime={entry.publishedAt.toISOString()} className="tabular">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                }).format(entry.publishedAt)}
              </time>
            )}
            <span aria-hidden className="h-px w-6 bg-ash" />
            <span className="tabular">{minutes} min read</span>
          </p>
        </div>
      </header>

      {cover && (
        /* A plain `img`: covers are URLs an administrator pastes in, and the
           optimiser would have to be opened to every remote host on the
           internet to serve them. `safeUrl` has already refused anything that
           is not http or https. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="mx-auto mt-10 w-full max-w-4xl px-6 md:mt-14 md:px-10"
        />
      )}

      {/* Split on blank lines and rendered as text nodes. The body is stored as
          plain text and never as HTML, which is what lets an admin-editable
          field reach a public page without a sanitiser in between. */}
      <div className="mx-auto w-full max-w-3xl px-6 py-14 md:px-10 md:py-20">
        <div className="max-w-[68ch] space-y-6">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[17px] leading-[1.75] whitespace-pre-line text-ink first:text-lg first:leading-[1.7]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-ash pt-8">
          <p className="max-w-sm text-sm leading-relaxed text-slate">
            Want this run on your own numbers? We write a growth thesis inside 48 hours, whether
            or not you hire us.
          </p>
          <Link
            href="/book"
            className="label inline-flex items-center gap-2 border-b border-ink pb-1 text-ink transition-colors hover:border-coral hover:text-coral"
          >
            Book a consultation
            <ArrowUpRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
