import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TYPES, listContent } from "@/lib/cms/store";
import { ContentForm } from "@/components/admin/admin-forms";
import { removeContent } from "./actions";
import { Plus } from "lucide-react";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  Section,
  SubmitButton,
  formatDate,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

/**
 * The CMS.
 *
 * Everything on one page, because there are a handful of entries and a list
 * screen plus an edit screen for six blog posts is two clicks to change a
 * typo. Each entry carries its own form; saving one leaves the rest alone.
 */
export default async function AdminCmsPage() {
  await requireAdmin();
  const entries = await listContent();

  const published = entries.filter((e) => e.publishedAt).length;

  return (
    <>
      <PageHeader
        title="Content"
        meta={
          entries.length === 0
            ? "Plain text in, paragraphs out. Nothing here is treated as HTML."
            : `${entries.length} entr${entries.length === 1 ? "y" : "ies"} · ${published} published · ${entries.length - published} draft`
        }
      />

      <details className="group mt-8 rounded-sheet border border-ash bg-bone-2">
        <summary className="label-sm flex cursor-pointer list-none items-center gap-2.5 px-5 py-4 text-slate transition-colors hover:text-ink md:px-6">
          <Plus
            aria-hidden
            className="size-3.5 transition-transform duration-300 ease-[var(--ease-out-quint)] group-open:rotate-45"
          />
          New entry
        </summary>
        <div className="border-t border-ash px-5 py-5 md:px-6">
          <p className="max-w-prose text-sm leading-relaxed text-slate">
            Plain text. Blank lines become paragraphs on the public page — nothing is treated as
            HTML, so nothing here can inject markup into the site.
          </p>
          <div className="mt-5">
            <ContentForm types={CONTENT_TYPES} />
          </div>
        </div>
      </details>

      {entries.length === 0 ? (
        <Empty>Nothing written yet.</Empty>
      ) : (
        <Section title="Everything" count={entries.length}>
          <ul className="mt-5 space-y-5">
            {entries.map((entry) => (
              <Card as="li" key={entry.id} className="transition-colors hover:border-ink/25">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight font-medium text-ink">
                      {entry.title}
                    </p>
                    <p className="label-xs mt-2 text-slate">
                      {entry.type.replace("_", " ")} · /{entry.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={entry.publishedAt ? "good" : "neutral"} dot>
                      {entry.publishedAt ? `Published ${formatDate(entry.publishedAt)}` : "Draft"}
                    </Pill>
                    <form action={removeContent}>
                      <input type="hidden" name="id" value={entry.id} />
                      <SubmitButton variant="danger" size="sm" busyLabel="Deleting…">
                        Delete
                      </SubmitButton>
                    </form>
                  </div>
                </div>

                <div className="mt-5 border-t border-ash pt-5">
                  <ContentForm content={entry} types={CONTENT_TYPES} />
                </div>
              </Card>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}
