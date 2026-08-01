"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifyPassword, wasteTime } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/cookie";
import { verifySession } from "@/lib/auth/dal";
import { setLeadStatus } from "@/lib/leads/store";
import { isLeadStatus } from "@/lib/leads/schema";

export type LoginState = { error?: string };

/**
 * Signs an admin in.
 *
 * One message for every failure — unknown address, wrong password, missing
 * secret — because a form that answers "no such account" differently from
 * "wrong password" is a way to find out which addresses have accounts. For the
 * same reason a miss still spends the time a bcrypt comparison would, so the
 * two cases cannot be told apart by how long they take.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Enter an email and password." };

  const generic = { error: "That email or password is wrong." };

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      await wasteTime(password);
      return generic;
    }
    if (!(await verifyPassword(password, admin.passwordHash))) return generic;

    await createSession(admin.id, admin.email);
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

export async function updateLeadStatus(formData: FormData): Promise<void> {
  /* The session check belongs here rather than only on the page: a server
     action is its own endpoint and can be posted to directly. */
  await verifySession();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !isLeadStatus(status)) return;

  await setLeadStatus(id, status);
  revalidatePath("/admin");
}
