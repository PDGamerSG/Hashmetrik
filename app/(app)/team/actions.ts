"use server";

/**
 * What staff do to a client's work.
 *
 * Every action calls `requireStaff()` first — a server action is its own
 * endpoint and can be posted to directly, so the check cannot live only on the
 * page that renders the form.
 *
 * Team members are not scoped to their own clients here. The agency is small
 * enough that a designer covering someone's leave should not be blocked by an
 * account-manager column, and the audit log records who did what. If that ever
 * needs tightening, `listProjectsForManager` already exists to do it with.
 */

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/dal";
import {
  addComment,
  addMilestone,
  createDeliverable,
  createProject,
  submitDeliverable,
  toggleMilestone,
  updateProject,
} from "@/lib/projects/store";
import {
  createCalendarEntry,
  deleteCalendarEntry,
  updateCalendarEntry,
} from "@/lib/calendar/store";
import { upsertKpi, deleteKpi, isPeriod } from "@/lib/kpis/store";
import { audienceForClient } from "@/lib/clients/store";
import { notifyMany } from "@/lib/notifications/store";
import { audit } from "@/lib/audit";
import { isHttpUrl } from "@/lib/url";

export type FormState = { error?: string; ok?: string };

/** `datetime-local` and `date` inputs both arrive as strings; empty means unset. */
function toDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Tells the client's side of the account, never the person who just acted. */
async function tellClient(clientId: string, actorId: string, message: string, href: string) {
  const audience = (await audienceForClient(clientId)).filter((id) => id !== actorId);
  await notifyMany(audience, message, { href }).catch(() => {});
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function newProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();

  const clientId = String(formData.get("clientId") ?? "");
  const serviceId = String(formData.get("serviceId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);

  if (!clientId || !serviceId) return { error: "Pick a client and a service." };
  if (!name) return { error: "Give the project a name." };

  try {
    const project = await createProject({
      clientId,
      serviceId,
      name,
      startDate: toDate(formData.get("startDate")),
      endDate: toDate(formData.get("endDate")),
    });
    await tellClient(clientId, staff.id, `A new project has opened: ${name}.`, "/dashboard/client");
    await audit({ actorId: staff.id, action: "project.create", entity: "Project", entityId: project.id });
  } catch (error) {
    console.error("[team] project not created", error);
    return { error: "That didn't save. Check the client is still active." };
  }

  revalidatePath("/team/projects");
  return { ok: `${name} created.` };
}

export async function saveProject(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const progressRaw = String(formData.get("progress") ?? "");
  const project = await updateProject(id, {
    status: String(formData.get("status") ?? "") || undefined,
    progress: progressRaw === "" ? undefined : Number(progressRaw),
    endDate: formData.has("endDate") ? toDate(formData.get("endDate")) : undefined,
  });

  await audit({ actorId: staff.id, action: "project.update", entity: "Project", entityId: id });
  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
  void project;
}

export async function newMilestone(formData: FormData): Promise<void> {
  await requireStaff();

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  if (!projectId || !title) return;

  await addMilestone(projectId, title, toDate(formData.get("dueDate")));
  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

export async function flipMilestone(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await toggleMilestone(id, String(formData.get("completed") ?? "") === "true");
  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------

export async function newDeliverable(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const fileUrl = String(formData.get("fileUrl") ?? "").trim().slice(0, 500);
  const type = String(formData.get("type") ?? "other");
  const submit = String(formData.get("submit") ?? "") === "true";

  if (!projectId) return { error: "Pick a project." };
  if (!title) return { error: "Give it a title." };
  if (!isHttpUrl(fileUrl)) return { error: "Paste a link to the file, starting http:// or https://." };

  try {
    const created = await createDeliverable({ projectId, title, type, fileUrl, submit });
    if (submit) {
      await tellClient(
        created.project.clientId,
        staff.id,
        `${title} is ready for your approval.`,
        "/dashboard/client",
      );
    }
    await audit({
      actorId: staff.id,
      action: submit ? "deliverable.submit" : "deliverable.create",
      entity: "Deliverable",
      entityId: created.id,
    });
  } catch (error) {
    console.error("[team] deliverable not created", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
  return { ok: submit ? `${title} sent for approval.` : `${title} saved as a draft.` };
}

export async function sendForApproval(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const updated = await submitDeliverable(id);
  await tellClient(
    updated.project.clientId,
    staff.id,
    `${updated.title} is ready for your approval.`,
    "/dashboard/client",
  );
  await audit({ actorId: staff.id, action: "deliverable.submit", entity: "Deliverable", entityId: id });

  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

export async function replyToClient(formData: FormData): Promise<void> {
  const staff = await requireStaff();

  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 2000);
  if (!id || !body) return;

  const posted = await addComment(id, staff.id, body);
  if (posted) {
    await tellClient(
      posted.clientId,
      staff.id,
      `New comment on ${posted.deliverableTitle}.`,
      "/dashboard/client",
    );
  }

  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

// ---------------------------------------------------------------------------
// Content calendar
// ---------------------------------------------------------------------------

export async function newCalendarEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await requireStaff();

  const clientId = String(formData.get("clientId") ?? "");
  const platform = String(formData.get("platform") ?? "").trim().slice(0, 40);
  const publishDate = toDate(formData.get("publishDate"));

  if (!clientId || !platform) return { error: "Pick a client and a platform." };
  if (!publishDate) return { error: "Give it a publish date." };

  const creativeUrl = String(formData.get("creativeUrl") ?? "").trim().slice(0, 500);
  if (creativeUrl && !isHttpUrl(creativeUrl)) {
    return { error: "The creative link should start http:// or https://." };
  }

  try {
    await createCalendarEntry({
      clientId,
      platform,
      caption: String(formData.get("caption") ?? "").trim().slice(0, 2000),
      creativeUrl,
      publishDate,
    });
    await tellClient(clientId, staff.id, "A new post is waiting for your approval.", "/dashboard/client/calendar");
  } catch (error) {
    console.error("[team] calendar entry not created", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/team/calendar");
  revalidatePath("/dashboard/client/calendar");
  return { ok: "Added to the calendar." };
}

export async function editCalendarEntry(formData: FormData): Promise<void> {
  await requireStaff();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  /* The same check the create path makes. It was missing here, which meant the
     one field a client clicks could be given a `javascript:` scheme by editing
     an entry rather than adding one — the form's `type="url"` stops a browser
     doing it, and a posted request is not a browser. Nothing is written when it
     fails: dropping just the URL would silently discard what was typed, and the
     rest of the edit is not worth saving against a link that was refused. */
  const creativeUrl = String(formData.get("creativeUrl") ?? "").trim().slice(0, 500);
  if (creativeUrl && !isHttpUrl(creativeUrl)) return;

  const publishDate = toDate(formData.get("publishDate"));
  await updateCalendarEntry(id, {
    caption: String(formData.get("caption") ?? "").slice(0, 2000),
    creativeUrl,
    ...(publishDate ? { publishDate } : {}),
  });

  revalidatePath("/team/calendar");
  revalidatePath("/dashboard/client/calendar");
}

export async function removeCalendarEntry(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteCalendarEntry(id);
  await audit({
    actorId: staff.id,
    action: "calendar.delete",
    entity: "ContentCalendarEntry",
    entityId: id,
  });

  revalidatePath("/team/calendar");
  revalidatePath("/dashboard/client/calendar");
}

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export async function recordKpi(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireStaff();

  const clientId = String(formData.get("clientId") ?? "");
  const metricName = String(formData.get("metricName") ?? "").trim().slice(0, 80);
  const period = String(formData.get("period") ?? "").trim();
  const valueRaw = String(formData.get("value") ?? "").trim();

  if (!clientId) return { error: "Pick a client." };
  if (!metricName) return { error: "Name the metric." };
  if (!isPeriod(period)) return { error: "The period should look like 2026-08." };

  const value = Number(valueRaw);
  if (!Number.isFinite(value)) return { error: "That value isn't a number." };

  try {
    await upsertKpi({
      clientId,
      serviceId: String(formData.get("serviceId") ?? "") || null,
      metricName,
      value,
      unit: String(formData.get("unit") ?? "").trim().slice(0, 20) || null,
      period,
    });
  } catch (error) {
    console.error("[team] kpi not recorded", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/team/reports");
  revalidatePath("/dashboard/client/reports");
  return { ok: `${metricName} recorded for ${period}.` };
}

export async function removeKpi(formData: FormData): Promise<void> {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteKpi(id);
  revalidatePath("/team/reports");
  revalidatePath("/dashboard/client/reports");
}

