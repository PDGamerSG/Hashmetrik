"use server";

/**
 * Everything an administrator can do.
 *
 * Every one of these calls `requireAdmin()` first. A server action is its own
 * endpoint — it can be posted to directly, without ever passing through
 * `proxy.ts` — so the check belongs here rather than only on the page that
 * renders the form.
 */

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createSession, destroySession } from "@/lib/auth/cookie";
import { requireAdmin } from "@/lib/auth/dal";
import { verifyPassword, wasteTime } from "@/lib/auth/password";
import { createStaff, findByEmail, setStatus } from "@/lib/accounts/store";
import { normalizeEmail, validatePassword } from "@/lib/accounts/schema";
import { isLeadStatus } from "@/lib/leads/schema";
import { setLeadStatus, linkLeadToUser } from "@/lib/leads/store";
import { activateClient, setAccountManager, setClientServices } from "@/lib/clients/store";
import { setConsultation } from "@/lib/consultations/store";
import { notify } from "@/lib/notifications/store";
import { audit } from "@/lib/audit";
import { consume } from "@/lib/rate-limit/store";
import { clientKey } from "@/lib/rate-limit/window";

export type LoginState = { error?: string };
export type ActionState = { error?: string; ok?: string };

const LOGIN_ATTEMPTS_PER_HOUR = 20;

/**
 * Signs an administrator in.
 *
 * One message for every failure — unknown address, wrong password, not an admin
 * — because a form that answers "no such account" differently from "wrong
 * password" is a way to find out which addresses have accounts, and one that
 * says "you are not an administrator" confirms the password was right. For the
 * same reason a miss still spends the time a bcrypt comparison would.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter an email and password." };

  try {
    const { allowed } = await consume(`admin-login:${clientKey(await headers())}`, LOGIN_ATTEMPTS_PER_HOUR);
    if (!allowed) return { error: "Too many attempts from this connection. Try again in an hour." };
  } catch (error) {
    /* A limiter that cannot reach the database must not lock the team out of
       their own dashboard. The passwords are still bcrypt. */
    console.error("[admin] rate limit unavailable", error);
  }

  const generic = { error: "That email or password is wrong." };

  try {
    const user = await findByEmail(email);

    if (!user) {
      await wasteTime(password);
      return generic;
    }
    if (!(await verifyPassword(password, user.passwordHash))) return generic;
    if (user.role !== "ADMIN") {
      /* Signed in successfully, wrong door. Saying so would confirm the
         password; the session is not created, so nothing is granted either. */
      return generic;
    }

    await createSession(user);
  } catch (error) {
    console.error("[admin] login failed", error);
    return { error: "Sign-in is unavailable right now." };
  }

  /* Outside the try: `redirect` works by throwing, and catching it here would
     turn a successful sign-in into "sign-in is unavailable". */
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function updateLeadStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isLeadStatus(status)) return;

  await setLeadStatus(id, status);
  revalidatePath("/admin");
}

/** Ties an enquiry to the account of the person who sent it. */
export async function matchLeadToAccount(formData: FormData): Promise<void> {
  await requireAdmin();

  const leadId = String(formData.get("leadId") ?? "");
  const email = normalizeEmail(formData.get("email"));
  if (!leadId || !email) return;

  const user = await findByEmail(email);
  if (!user) return;

  await linkLeadToUser(leadId, user.id);
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------

export async function updateConsultation(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const updated = await setConsultation(id, {
    status: String(formData.get("status") ?? ""),
    scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
    notes: String(formData.get("notes") ?? "").trim().slice(0, 2000),
  });

  if (updated?.userId) {
    await notify(
      updated.userId,
      updated.status === "scheduled" && updated.scheduledAt
        ? `Your consultation is confirmed for ${updated.scheduledAt.toDateString()}.`
        : `Your consultation is now ${updated.status}.`,
      { href: "/dashboard" },
    ).catch(() => {});
  }

  await audit({
    actorId: admin.id,
    action: "consultation.update",
    entity: "Consultation",
    entityId: id,
  });
  revalidatePath("/admin/consultations");
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

/**
 * Turns a registered user into a client.
 *
 * This is the one action in the app that grants access to a whole area, so it
 * is the one that is audited hardest. The status flip, the client row and the
 * services all happen in a single transaction — see `lib/clients/store.ts`.
 */
export async function activateUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  if (!userId) return { error: "No account chosen." };

  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);
  const accountManagerId = String(formData.get("accountManagerId") ?? "") || null;
  const companyName = String(formData.get("companyName") ?? "").trim().slice(0, 120) || null;

  try {
    const { user, clientId } = await activateClient({
      userId,
      companyName,
      accountManagerId,
      serviceIds,
    });

    await notify(
      user.id,
      "Your account is active. Your services, projects and reports are in your dashboard.",
      { href: "/dashboard/client", type: "success" },
    ).catch(() => {});

    await audit({
      actorId: admin.id,
      action: "client.activate",
      entity: "Client",
      entityId: clientId,
      meta: { userId, serviceIds, accountManagerId },
    });
  } catch (error) {
    console.error("[admin] activation failed", error);
    return { error: "That didn't work. Check the account still exists and try again." };
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/users");
  return { ok: "Account activated." };
}

export async function deactivateUser(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  /* The client row is left in place: the projects and reports hanging off it
     are a record of work done, and deleting them to express "not a client any
     more" would be the wrong trade. Status is what the dashboard reads. */
  await setStatus(userId, "NON_CLIENT");
  await audit({ actorId: admin.id, action: "client.deactivate", entity: "User", entityId: userId });
  revalidatePath("/admin/clients");
  revalidatePath("/admin/users");
}

export async function assignAccountManager(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const accountManagerId = String(formData.get("accountManagerId") ?? "") || null;
  await setAccountManager(clientId, accountManagerId);
  await audit({
    actorId: admin.id,
    action: "client.assignManager",
    entity: "Client",
    entityId: clientId,
    meta: { accountManagerId },
  });
  revalidatePath("/admin/clients");
}

export async function assignServices(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);
  await setClientServices(clientId, serviceIds);
  await audit({
    actorId: admin.id,
    action: "client.assignServices",
    entity: "Client",
    entityId: clientId,
    meta: { serviceIds },
  });
  revalidatePath("/admin/clients");
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

/**
 * Creates a team member or another administrator.
 *
 * There is no self-signup for either role and no way to promote an existing
 * account through the UI: a staff account is made here, deliberately, by
 * somebody who already had one.
 */
export async function addStaff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const email = normalizeEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "TEAM_MEMBER");
  const role = roleRaw === "ADMIN" ? "ADMIN" : "TEAM_MEMBER";
  const roleTitle = String(formData.get("roleTitle") ?? "").trim().slice(0, 80);

  if (!name) return { error: "Add a name." };
  if (!email) return { error: "Add an email address." };
  const badPassword = validatePassword(password);
  if (badPassword) return { error: badPassword };

  try {
    const user = await createStaff({ email, name, password, role, roleTitle });
    await audit({
      actorId: admin.id,
      action: "staff.create",
      entity: "User",
      entityId: user.id,
      meta: { role },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { error: "There is already an account on that address." };
    }
    console.error("[admin] staff not created", error);
    return { error: "That didn't work. Try again." };
  }

  revalidatePath("/admin/team");
  return { ok: `${name} can sign in now.` };
}
