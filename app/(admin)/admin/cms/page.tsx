import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TYPES, listContent } from "@/lib/cms/store";
import { ContentForm } from "@/components/admin/admin-forms";
import { removeContent } from "./actions";
import {
  Card,
  Empty,
  PageHeader,
  Pill,
  SectionTitle,
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
        meta={`${entries.length} entries · ${published} published`}
      />

      <Card className="mt-8">
        <SectionTitle>New entry</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Plain text. Blank lines become paragraphs on the public page — nothing is treated as
          HTML, so nothing here can inject markup into the site.
        </p>
        <div className="mt-4">
          <ContentForm types={CONTENT_TYPES} />
        </div>
      </Card>

      {entries.length === 0 ? (
        <Empty>Nothing written yet.</Empty>
      ) : (
        <section className="mt-10">
          <SectionTitle count={entries.length}>Everything</SectionTitle>
          <ul className="mt-4 space-y-6">
            {entries.map((entry) => (
              <Card as="li" key={entry.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="label-sm text-slate">
                      {entry.type.replace("_", " ")} · /{entry.slug}
                    </p>
                    <p className="mt-1 font-display text-lg font-medium text-ink">{entry.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={entry.publishedAt ? "good" : "neutral"}>
                      {entry.publishedAt ? `Published ${formatDate(entry.publishedAt)}` : "Draft"}
                    </Pill>
                    <form action={removeContent}>
                      <input type="hidden" name="id" value={entry.id} />
                      <SubmitButton variant="quiet">Delete</SubmitButton>
                    </form>
                  </div>
                </div>

                <div className="mt-4 border-t border-ash pt-4">
                  <ContentForm content={entry} types={CONTENT_TYPES} />
                </div>
              </Card>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
