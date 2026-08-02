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
import {
  adminUpdateUser,
  countOtherActiveAdmins,
  createAccount,
  findByEmail,
  findUser,
  setPassword,
  setRole,
  setStatus,
  setSuspended,
} from "@/lib/accounts/store";
import { normalizeEmail, validatePassword } from "@/lib/accounts/schema";
import { isRole } from "@/lib/auth/session";
import { isLeadStatus } from "@/lib/leads/schema";
import { setLeadStatus, linkLeadToUser } from "@/lib/leads/store";
import {
  activateClient,
  setAccountManager,
  setClientServices,
  setClientTeam,
} from "@/lib/clients/store";
import { PROJECT_STATUSES, updateProject } from "@/lib/projects/store";
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

/**
 * Moves an enquiry along the pipeline.
 *
 * `"layout"`, not the default `"page"`. Both of these are driven from
 * `/admin/leads`, and `revalidatePath("/admin")` invalidates the overview page
 * alone — nothing under it. The row on screen kept the old status, the select
 * snapped back to its previous `defaultValue`, and "Save" read as a button that
 * does nothing. The layout form covers the overview, which counts leads, and
 * every page beneath it.
 */
export async function updateLeadStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isLeadStatus(status)) return;

  await setLeadStatus(id, status);
  revalidatePath("/admin", "layout");
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
  revalidatePath("/admin", "layout");
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

/**
 * Puts a team on a client.
 *
 * Separate from the account manager, and deliberately: one person answers the
 * phone, several people do the work, and collapsing the two would mean either a
 * client with six named contacts or a designer who cannot see the account they
 * are building for. Being assigned is what `/team` scopes its lists by.
 */
export async function assignTeam(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "");
  if (!clientId) return;

  const teamMemberIds = formData.getAll("teamMemberIds").map(String).filter(Boolean);
  await setClientTeam(clientId, teamMemberIds);
  await audit({
    actorId: admin.id,
    action: "client.assignTeam",
    entity: "Client",
    entityId: clientId,
    meta: { teamMemberIds },
  });
  revalidatePath("/admin/clients");
  revalidatePath("/team");
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
// Projects
//
// Creating a project and moving its milestones stay in `app/(app)/team/actions.ts`
// — an administrator is staff, so those actions already admit them, and a second
// copy here would be a second place for the rules to drift. What lives here is
// the part only an administrator does: the plan itself, and archiving.
// ---------------------------------------------------------------------------

/** `date` inputs arrive as strings; an empty one means "no date", not "invalid". */
function toDate(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Name, status, progress and both ends of the timeline, in one save.
 *
 * One form rather than four, because these are read together and changed
 * together — a project moved to `paused` almost always wants its target date
 * moved too, and two buttons is two chances to do one and forget the other.
 */
export async function saveProjectPlan(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const statusRaw = String(formData.get("status") ?? "");
  const status = (PROJECT_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : undefined;
  const progressRaw = String(formData.get("progress") ?? "").trim();

  await updateProject(id, {
    name: String(formData.get("name") ?? "").trim().slice(0, 120) || undefined,
    status,
    progress: progressRaw === "" ? undefined : Number(progressRaw),
    startDate: toDate(formData.get("startDate")),
    endDate: toDate(formData.get("endDate")),
  });

  await audit({ actorId: admin.id, action: "project.plan", entity: "Project", entityId: id });
  revalidatePath("/admin", "layout");
  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

/**
 * Takes a project out of the queues without deleting it.
 *
 * Deleting would take the milestones and deliverables with it, and those are the
 * record of what the agency actually did for that money. Archiving is a status,
 * so everything under it stays readable and every "active" count stops including
 * it.
 */
export async function archiveProject(formData: FormData): Promise<void> {
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const restore = String(formData.get("restore") ?? "") === "true";
  await updateProject(id, { status: restore ? "active" : "archived" });

  await audit({
    actorId: admin.id,
    action: restore ? "project.restore" : "project.archive",
    entity: "Project",
    entityId: id,
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/team/projects");
  revalidatePath("/dashboard/client");
}

// ---------------------------------------------------------------------------
// Accounts
//
// Create, edit, activate, suspend and change roles — the five things the PRD
// asks a user-management screen to do. Two rules run through all of them:
//
//  - An administrator cannot act on their own access. Not because it is
//    dangerous in itself, but because every mistake it allows is one that locks
//    the person making it out of the screen they would fix it on.
//  - The last administrator who can still sign in cannot be suspended or
//    demoted. There is no recovery path in the product for a platform with no
//    administrator; the only fix would be a hand-written row in the database.
// ---------------------------------------------------------------------------

/** Null when the administrator is not acting on themselves. */
function refuseSelfLockout(actorId: string, targetId: string, verb: string): string | null {
  return actorId === targetId ? `You cannot ${verb} your own account.` : null;
}

/** Null when the platform would still have a working administrator afterwards. */
async function refuseLastAdmin(target: { id: string; role: string }): Promise<string | null> {
  if (target.role !== "ADMIN") return null;
  const others = await countOtherActiveAdmins(target.id);
  return others > 0
    ? null
    : "That is the last administrator who can sign in. Make somebody else an administrator first.";
}

/**
 * Creates an account in any role.
 *
 * There is no self-signup for staff and no way to reach this except behind
 * `requireAdmin()`. A registered user can be made here too — the sales team
 * takes details over the phone often enough that "tell them to go and sign up"
 * is a step nobody should have to explain.
 */
export async function addAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const email = normalizeEmail(formData.get("email"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  const password = String(formData.get("password") ?? "");
  const roleRaw = String(formData.get("role") ?? "TEAM_MEMBER");
  const role = isRole(roleRaw) ? roleRaw : "TEAM_MEMBER";
  const roleTitle = String(formData.get("roleTitle") ?? "").trim().slice(0, 80);

  if (!name) return { error: "Add a name." };
  if (!email) return { error: "Add an email address." };
  const badPassword = validatePassword(password);
  if (badPassword) return { error: badPassword };

  try {
    const user = await createAccount({
      email,
      name,
      password,
      role,
      roleTitle,
      phone: String(formData.get("phone") ?? "").trim().slice(0, 20),
      businessName: String(formData.get("businessName") ?? "").trim().slice(0, 120),
    });
    await audit({
      actorId: admin.id,
      action: "account.create",
      entity: "User",
      entityId: user.id,
      meta: { role },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002") {
      return { error: "There is already an account on that address." };
    }
    console.error("[admin] account not created", error);
    return { error: "That didn't work. Try again." };
  }

  revalidatePath("/admin", "layout");
  return { ok: `${name} can sign in now.` };
}

/**
 * Moves an account between roles.
 *
 * The `TeamMember` row that a promotion needs is created inside the same
 * transaction as the role change — see `setRole` — so an account is never staff
 * without the profile every "assign a person" control reads.
 */
export async function changeRole(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  if (!userId || !isRole(roleRaw)) return { error: "Pick a role." };

  const target = await findUser(userId);
  if (!target) return { error: "That account no longer exists." };
  if (target.role === roleRaw) return { ok: "Nothing to change." };

  const selfProblem = refuseSelfLockout(admin.id, userId, "change the role on");
  if (selfProblem) return { error: selfProblem };

  /* Only when the change removes an administrator, not when it adds one. */
  if (roleRaw !== "ADMIN") {
    const lastAdmin = await refuseLastAdmin(target);
    if (lastAdmin) return { error: lastAdmin };
  }

  try {
    await setRole(userId, roleRaw);
    await audit({
      actorId: admin.id,
      action: "account.changeRole",
      entity: "User",
      entityId: userId,
      meta: { from: target.role, to: roleRaw },
    });
  } catch (error) {
    console.error("[admin] role not changed", error);
    return { error: "That didn't work. Try again." };
  }

  revalidatePath("/admin", "layout");
  return { ok: `${target.name ?? target.email} is now ${ROLE_LABELS[roleRaw]}.` };
}

const ROLE_LABELS = {
  REGISTERED_USER: "a registered user",
  TEAM_MEMBER: "a team member",
  ADMIN: "an administrator",
} as const;

/**
 * Closes or reopens an account.
 *
 * Suspension is checked against the live row on every gated request, so a
 * suspended person is out on their next page load rather than their next login
 * — including one who is signed in and clicking while this runs.
 */
export async function toggleSuspension(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  if (!userId) return { error: "No account chosen." };

  const target = await findUser(userId);
  if (!target) return { error: "That account no longer exists." };

  if (suspend) {
    const selfProblem = refuseSelfLockout(admin.id, userId, "suspend");
    if (selfProblem) return { error: selfProblem };

    const lastAdmin = await refuseLastAdmin(target);
    if (lastAdmin) return { error: lastAdmin };
  }

  try {
    await setSuspended(userId, suspend);
    await audit({
      actorId: admin.id,
      action: suspend ? "account.suspend" : "account.restore",
      entity: "User",
      entityId: userId,
    });
    if (!suspend) {
      await notify(userId, "Your account has been restored.", { href: "/dashboard" }).catch(
        () => {},
      );
    }
  } catch (error) {
    console.error("[admin] suspension not changed", error);
    return { error: "That didn't work. Try again." };
  }

  revalidatePath("/admin", "layout");
  return {
    ok: suspend
      ? `${target.name ?? target.email} can no longer sign in.`
      : `${target.name ?? target.email} has their access back.`,
  };
}

/**
 * An admin editing somebody else's details.
 *
 * Present because the alternative is a support queue: a client who mistyped
 * their company name at signup currently has to be talked through finding the
 * profile form. It writes the four fields that form writes and nothing else —
 * email is the login and role has its own action, both deliberately out of reach
 * of a general "edit" button.
 */
export async function editAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!userId) return { error: "No account chosen." };
  if (!name) return { error: "Add a name." };

  try {
    await adminUpdateUser(userId, {
      name,
      phone: String(formData.get("phone") ?? "").trim().slice(0, 20),
      businessName: String(formData.get("businessName") ?? "").trim().slice(0, 120),
      businessType: String(formData.get("businessType") ?? "").trim().slice(0, 80),
    });
    await audit({ actorId: admin.id, action: "account.edit", entity: "User", entityId: userId });
  } catch (error) {
    console.error("[admin] account not edited", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

/**
 * Sets somebody's password for them.
 *
 * This is the product's whole password-recovery story for now: there is no
 * emailed reset link, and a person locked out has to ask. Audited like an access
 * change, because it is one — whoever runs this can sign in as that account
 * afterwards.
 */
export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!userId) return { error: "No account chosen." };

  const badPassword = validatePassword(password);
  if (badPassword) return { error: badPassword };

  try {
    await setPassword(userId, password);
    await audit({
      actorId: admin.id,
      action: "account.resetPassword",
      entity: "User",
      entityId: userId,
    });
    await notify(userId, "An administrator has set a new password on your account.").catch(
      () => {},
    );
  } catch (error) {
    console.error("[admin] password not reset", error);
    return { error: "That didn't work. Try again." };
  }

  return { ok: "Password set. Send it to them by a channel that isn't email." };
}
