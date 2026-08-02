"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { deleteContent, isContentType, toSlug, upsertContent } from "@/lib/cms/store";
import { audit } from "@/lib/audit";
import { isHttpUrl } from "@/lib/url";

export type ContentState = { error?: string; ok?: string };

export async function saveContent(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  const admin = await requireAdmin();

  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 20000);
  /* Normalised rather than rejected: somebody typing "About Us" into a slug
     field means `about-us`, and telling them off for it helps nobody. */
  const slug = toSlug(String(formData.get("slug") ?? "") || title);

  if (!isContentType(type)) return { error: "Pick a content type." };
  if (!title) return { error: "Give it a title." };
  if (!slug) return { error: "That slug reduces to nothing. Use letters or numbers." };
  if (!body) return { error: "The body is empty." };

  /* Reaches Open Graph metadata and, if the page ever renders it, an `<img>`.
     Same rule as every other link a person types in — see `lib/url.ts`. */
  const coverUrl = String(formData.get("coverUrl") ?? "").trim().slice(0, 500);
  if (coverUrl && !isHttpUrl(coverUrl)) {
    return { error: "The cover image link should start http:// or https://." };
  }

  const id = String(formData.get("id") ?? "") || undefined;

  try {
    const saved = await upsertContent({
      id,
      type,
      slug,
      title,
      excerpt: String(formData.get("excerpt") ?? "").trim().slice(0, 300),
      body,
      coverUrl,
      published: String(formData.get("published") ?? "") === "true",
    });

    await audit({
      actorId: admin.id,
      action: id ? "cms.update" : "cms.create",
      entity: "CMSContent",
      entityId: saved.id,
      meta: { slug, type },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { error: `Something else already uses the slug "${slug}".` };
    }
    console.error("[admin] content not saved", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/admin/cms");
  /* The public pages read this content, so their cache has to go too. */
  revalidatePath(`/${slug}`);
  revalidatePath("/blog");
  return { ok: `Saved "${title}".` };
}

export async function removeContent(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteContent(id);
  await audit({ actorId: admin.id, action: "cms.delete", entity: "CMSContent", entityId: id });
  revalidatePath("/admin/cms");
  revalidatePath("/blog");
}
