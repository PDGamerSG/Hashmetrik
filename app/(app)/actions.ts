"use server";

/**
 * Signing up, signing in, signing out, and editing your own profile.
 *
 * The admin area keeps its own login action next to its own form — the copy and
 * the destination differ, and one action that branches on role would have to be
 * read twice to be trusted.
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession } from "@/lib/auth/cookie";
import { verifySession } from "@/lib/auth/dal";
import { verifyPassword, wasteTime } from "@/lib/auth/password";
import {
  createRegisteredUser,
  findByEmail,
  updateProfile,
} from "@/lib/accounts/store";
import {
  normalizeEmail,
  normalizeSignup,
  validateSignup,
} from "@/lib/accounts/schema";
import { attachLeadsToUser } from "@/lib/leads/store";
import { consume } from "@/lib/rate-limit/store";
import { clientKey } from "@/lib/rate-limit/window";
import { notify } from "@/lib/notifications/store";

export type FormState = { error?: string; ok?: string };

/** Attempts per IP per hour, for both forms. Generous for a person, tight for a script. */
const AUTH_ATTEMPTS_PER_HOUR = 20;

/**
 * Counts an attempt and says whether it may proceed.
 *
 * Failing open when the counter is unreachable: a database blip should not
 * lock everyone out of their account, and the passwords are still bcrypt.
 */
async function withinRateLimit(scope: string): Promise<boolean> {
  try {
    const key = `${scope}:${clientKey(await headers())}`;
    const { allowed } = await consume(key, AUTH_ATTEMPTS_PER_HOUR);
    return allowed;
  } catch (error) {
    console.error("[auth] rate limit unavailable", error);
    return true;
  }
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const input = normalizeSignup({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    businessName: String(formData.get("businessName") ?? ""),
    businessType: String(formData.get("businessType") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  const problem = validateSignup(input);
  if (problem) return { error: problem };

  if (!(await withinRateLimit("signup"))) {
    return { error: "Too many attempts from this connection. Try again in an hour." };
  }

  try {
    /* The unique index is what actually decides this, and checking first would
       still race. Catching the constraint is the only version that cannot
       create two accounts on the same address. */
    const user = await createRegisteredUser(input);
    await createSession(user);

    /* Somebody who filled in the contact form last week and signs up today is
       one person. Attaching the enquiry now means their dashboard shows it,
       and the pipeline stops carrying a duplicate of them. */
    await attachLeadsToUser(user.email, user.id).catch((error) => {
      console.error("[auth] earlier enquiries not attached", user.id, error);
    });

    await notify(
      user.id,
      "Welcome to HashMetrik. Book a consultation and a strategist will take it from there.",
      { href: "/book" },
    ).catch(() => {});
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "There is already an account on that address. Sign in instead." };
    }
    console.error("[auth] signup failed", error);
    return { error: "That didn't work. Try again in a moment." };
  }

  redirect("/dashboard");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter an email and password." };

  if (!(await withinRateLimit("login"))) {
    return { error: "Too many attempts from this connection. Try again in an hour." };
  }

  /* One message for every failure — unknown address, wrong password — because a
     form that answers "no such account" differently is a way to find out which
     addresses have accounts. For the same reason a miss still spends the time a
     bcrypt comparison would, so the two cannot be told apart by how long they
     take. */
  const generic = { error: "That email or password is wrong." };
  let home = "/dashboard";

  try {
    const user = await findByEmail(email);
    if (!user) {
      await wasteTime(password);
      return generic;
    }
    if (!(await verifyPassword(password, user.passwordHash))) return generic;

    await createSession(user);
    home = user.role === "ADMIN" ? "/admin" : user.role === "TEAM_MEMBER" ? "/team" : "/dashboard";
  } catch (error) {
    console.error("[auth] login failed", error);
    return { error: "Sign-in is unavailable right now." };
  }

  /* Outside the try: `redirect` works by throwing, and catching it here would
     turn a successful sign-in into "sign-in is unavailable". */
  redirect(home);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await verifySession();

  const name = String(formData.get("name") ?? "").trim().slice(0, 100);
  if (!name) return { error: "Add your name." };

  try {
    await updateProfile(viewer.id, {
      name,
      phone: String(formData.get("phone") ?? "").trim().slice(0, 20),
      businessName: String(formData.get("businessName") ?? "").trim().slice(0, 120),
      businessType: String(formData.get("businessType") ?? "").trim().slice(0, 80),
    });
  } catch (error) {
    console.error("[auth] profile not saved", error);
    return { error: "That didn't save. Try again." };
  }

  revalidatePath("/dashboard");
  return { ok: "Saved." };
}

/** Prisma's unique-constraint failure, without importing the error class. */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}
