"use server";

/**
 * What a signed-in visitor can do for themselves.
 *
 * Every one of these calls `verifySession()` and scopes its write by the id it
 * returns. Nothing here takes a user id from the form — a server action is its
 * own endpoint, and an action that accepts "whose row is this?" from the client
 * is an action that edits anyone's.
 */

import { revalidatePath } from "next/cache";
import { verifySession, requireClient } from "@/lib/auth/dal";
import { requestConsultation } from "@/lib/consultations/store";
import { markAllRead, markRead, notifyMany } from "@/lib/notifications/store";
import { decideDeliverable, addComment } from "@/lib/projects/store";
import { decideCalendarEntry } from "@/lib/calendar/store";
import { audienceForClient } from "@/lib/clients/store";

export type FormState = { error?: string; ok?: string };

export async function askForConsultation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await verifySession();

  const topic = String(formData.get("topic") ?? "").trim().slice(0, 120);
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);
  if (!topic) return { error: "Say what you'd like to talk about." };

  try {
    await requestConsultation({ userId: viewer.id, topic, notes });
  } catch (error) {
    console.error("[dashboard] consultation not requested", error);
    return { error: "That didn't send. Try again in a moment." };
  }

  revalidatePath("/dashboard");
  return { ok: "Requested. A strategist will confirm a time by email." };
}

/**
 * Marking a notice read.
 *
 * `"layout"`, not the default `"page"`. These two are called from
 * `/dashboard/notifications`, and `revalidatePath("/dashboard")` on its own
 * invalidates the `/dashboard` page and nothing under it — so the row stayed
 * unread on screen, the button looked broken, and the only way to see the write
 * had landed was to reload by hand. The layout form invalidates every page
 * beneath `/dashboard`, which is also what refreshes the unread count in the
 * nav: that badge is rendered by `dashboard/layout.tsx`, so a page-level
 * revalidation could never have moved it either.
 */
export async function readNotification(formData: FormData): Promise<void> {
  const viewer = await verifySession();
  const id = String(formData.get("id") ?? "");
  if (id) await markRead(viewer.id, id);
  revalidatePath("/dashboard", "layout");
}

export async function readAllNotifications(): Promise<void> {
  const viewer = await verifySession();
  await markAllRead(viewer.id);
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Client decisions
// ---------------------------------------------------------------------------

/**
 * Approves a deliverable or sends it back.
 *
 * `requireClient()` returns the client row, and the write is scoped by that id
 * as well as the deliverable's — so a client who guesses another client's
 * deliverable id changes nothing.
 */
export async function decide(formData: FormData): Promise<void> {
  const { client, viewer } = await requireClient();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "approved" && decision !== "changes_requested")) return;

  const note = String(formData.get("note") ?? "").trim().slice(0, 2000);

  const updated = await decideDeliverable({
    deliverableId: id,
    clientId: client.id,
    status: decision,
  });
  if (!updated) return;

  if (note) await addComment(id, viewer.id, note).catch(() => {});

  /* The team hears about it here rather than by email: the person who has to
     act on a change request is the one whose dashboard it lands in. */
  const audience = (await audienceForClient(client.id)).filter((id) => id !== viewer.id);
  await notifyMany(
    audience,
    decision === "approved"
      ? `${updated.title} was approved.`
      : `${updated.title} needs changes.`,
    { href: "/team", type: decision === "approved" ? "success" : "warn" },
  ).catch(() => {});

  revalidatePath("/dashboard/client");
}

export async function comment(formData: FormData): Promise<void> {
  const { client, viewer } = await requireClient();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!id || !body) return;

  const posted = await addComment(id, viewer.id, body, client.id);
  if (!posted) return;

  const audience = (await audienceForClient(client.id)).filter((uid) => uid !== viewer.id);
  await notifyMany(audience, `New comment on ${posted.deliverableTitle}.`, {
    href: "/team",
  }).catch(() => {});

  revalidatePath("/dashboard/client");
}

export async function decideCalendar(formData: FormData): Promise<void> {
  const { client, viewer } = await requireClient();

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || (decision !== "approved" && decision !== "changes_requested")) return;

  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  const updated = await decideCalendarEntry(id, client.id, decision, note);
  if (!updated) return;

  const audience = (await audienceForClient(client.id)).filter((uid) => uid !== viewer.id);
  await notifyMany(
    audience,
    decision === "approved"
      ? `A ${updated.platform} post was approved.`
      : `A ${updated.platform} post needs changes.`,
    { href: "/team", type: decision === "approved" ? "success" : "warn" },
  ).catch(() => {});

  revalidatePath("/dashboard/client/calendar");
}
