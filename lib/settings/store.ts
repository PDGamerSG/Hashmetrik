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
/**
 * `group` is which admin screen renders the setting, and `max` is how much of it
 * is kept. Both are here rather than at the call site because a setting that is
 * declared in one place and rendered in two is a setting somebody will edit on
 * the wrong page, and a single truncation length shared by a phone number and a
 * knowledge base is a knowledge base cut off mid-sentence.
 */
export const SETTINGS = [
  {
    key: "company.name",
    group: "company",
    label: "Company name",
    hint: "Used in emails and on the invoice footer.",
    fallback: "Hashmetrik",
    max: 200,
    multiline: false,
  },
  {
    key: "company.email",
    group: "company",
    label: "Contact email",
    hint: "Where lead notifications and replies go.",
    fallback: "info@hashmetrik.in",
    max: 200,
    multiline: false,
  },
  {
    key: "company.phone",
    group: "company",
    label: "Contact phone",
    hint: "Shown to clients in their dashboard footer.",
    fallback: "",
    max: 200,
    multiline: false,
  },
  {
    key: "email.leadSubject",
    group: "email",
    label: "Lead email subject",
    hint: "The subject line on the team's new-enquiry notification.",
    fallback: "New enquiry from the website",
    max: 200,
    multiline: false,
  },
  {
    key: "email.leadIntro",
    group: "email",
    label: "Lead email opening line",
    hint: "Sits above the enquiry details in the team's notification.",
    fallback: "A new enquiry came in from the website.",
    max: 600,
    multiline: true,
  },
  {
    key: "email.welcome",
    group: "email",
    label: "Welcome notification",
    hint: "The first thing a new account sees in its notifications.",
    fallback:
      "Welcome to Hashmetrik. Book a consultation and a strategist will take it from there.",
    max: 600,
    multiline: true,
  },
  {
    key: "consultation.slaHours",
    group: "company",
    label: "Reply target (hours)",
    hint: "Quoted to visitors on the contact page.",
    fallback: "2",
    max: 200,
    multiline: false,
  },
  {
    key: "assistant.knowledge",
    group: "assistant",
    label: "Knowledge base",
    hint: "Facts the assistant may state. Appended to the prompt built from the site's own content — put things here that are true but not on a page.",
    fallback: "",
    max: 8000,
    multiline: true,
  },
  {
    key: "assistant.instructions",
    group: "assistant",
    label: "Extra instructions",
    hint: "Added after the standing rules. Use it to tighten behaviour, not to restate what the site already says.",
    fallback: "",
    max: 4000,
    multiline: true,
  },
] as const;

export type SettingKey = (typeof SETTINGS)[number]["key"];
export type SettingGroup = (typeof SETTINGS)[number]["group"];

export function isSettingKey(value: unknown): value is SettingKey {
  return typeof value === "string" && SETTINGS.some((s) => s.key === value);
}

/** The settings one screen is responsible for. */
export function settingsIn(group: SettingGroup) {
  return SETTINGS.filter((setting) => setting.group === group);
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
