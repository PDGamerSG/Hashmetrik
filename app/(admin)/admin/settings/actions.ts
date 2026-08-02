"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { SETTINGS, writeSetting } from "@/lib/settings/store";
import { audit } from "@/lib/audit";

/**
 * Saves the whole settings form.
 *
 * Iterates the declared list rather than the submitted fields, so a posted key
 * that is not a known setting writes nothing — the form is one endpoint, and an
 * endpoint that stores whatever it is sent is a key/value table anyone can fill.
 */
export async function saveSettings(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const changed: string[] = [];
  for (const setting of SETTINGS) {
    const raw = formData.get(setting.key);
    if (raw === null) continue;
    await writeSetting(setting.key, String(raw).trim().slice(0, setting.max));
    changed.push(setting.key);
  }

  await audit({
    actorId: admin.id,
    action: "settings.update",
    entity: "Setting",
    meta: { keys: changed },
  });

  /* `"layout"`, because these values are read on more than the page that edits
     them — the assistant prompt is one of them. */
  revalidatePath("/admin", "layout");
}
