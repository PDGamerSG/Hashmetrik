import "server-only";

import { prisma } from "@/lib/db";

/**
 * Editable configuration.
 *
 * A key/value table rather than a column per setting: these are read in one
 * place each, changed rarely, and adding one should not be a migration. The
 * known keys are declared here so the admin screen can render a labelled form
 * rather than a raw JSON box, and so a typo in a key produces a missing setting
 * rather than a silently ignored one.
 */
export const SETTINGS = [
  {
    key: "company.name",
    label: "Company name",
    hint: "Used in emails and on the invoice footer.",
    fallback: "HashMetrik",
  },
  {
    key: "company.email",
    label: "Contact email",
    hint: "Where lead notifications and replies go.",
    fallback: "info@hashmetrik.in",
  },
  {
    key: "company.phone",
    label: "Contact phone",
    hint: "Shown to clients in their dashboard footer.",
    fallback: "",
  },
  {
    key: "email.leadSubject",
    label: "Lead email subject",
    hint: "The subject line on the team's new-enquiry notification.",
    fallback: "New enquiry from the website",
  },
  {
    key: "consultation.slaHours",
    label: "Reply target (hours)",
    hint: "Quoted to visitors on the contact page.",
    fallback: "2",
  },
] as const;

export type SettingKey = (typeof SETTINGS)[number]["key"];

export function isSettingKey(value: unknown): value is SettingKey {
  return typeof value === "string" && SETTINGS.some((s) => s.key === value);
}

/** Every setting, with its fallback filled in for anything never saved. */
export async function readSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  const saved = new Map(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    SETTINGS.map((setting) => {
      const value = saved.get(setting.key);
      return [setting.key, typeof value === "string" ? value : setting.fallback];
    }),
  );
}

export async function writeSetting(key: SettingKey, value: string) {
  return prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
