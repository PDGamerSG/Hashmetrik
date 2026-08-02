/**
 * Account shapes, normalisation and validation.
 *
 * Free of `server-only`, Prisma and `next/*` on purpose: this is the part worth
 * testing, and it should be runnable by `node --test` without a request or a
 * database behind it. Anything that touches the database lives in `store.ts`.
 */

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Twelve characters, no composition rules.
 *
 * Length is the only requirement that reliably buys entropy; "one uppercase,
 * one digit, one symbol" mostly buys `Password1!`, which is in every list.
 * NIST has said as much since 2017. The ceiling exists because bcrypt silently
 * truncates at 72 bytes, and a password that is quietly not what the user typed
 * is worse than one that was refused.
 */
export const MIN_PASSWORD = 12;
export const MAX_PASSWORD = 72;

/** Field ceilings, matched to what the forms enforce. */
const LIMITS = {
  name: 100,
  email: 255,
  businessName: 120,
  businessType: 80,
  phone: 20,
} as const;

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Addresses are compared case-insensitively, so they are stored that way. */
export function normalizeEmail(value: unknown): string {
  return clean(value, LIMITS.email).toLowerCase();
}

export function normalizeSignup(input: Partial<SignupInput>): SignupInput {
  return {
    name: clean(input.name, LIMITS.name),
    email: normalizeEmail(input.email),
    /* Not trimmed: leading and trailing spaces are legitimate password
       characters, and silently removing them means the password that was set
       is not the one that was typed. */
    password: typeof input.password === "string" ? input.password : "",
    businessName: clean(input.businessName, LIMITS.businessName),
    businessType: clean(input.businessType, LIMITS.businessType),
    phone: clean(input.phone, LIMITS.phone),
  };
}

/** Returns the message to show, or null when the signup is good. */
export function validateSignup(input: SignupInput): string | null {
  if (!input.name) return "Add your name.";
  if (!EMAIL.test(input.email)) return "That email address looks incomplete.";
  return validatePassword(input.password);
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters. A short phrase beats a clever word.`;
  }
  /* Measured in bytes, because that is what bcrypt truncates. */
  if (new TextEncoder().encode(password).length > MAX_PASSWORD) {
    return `That is longer than ${MAX_PASSWORD} bytes, which is as much as the hash can hold.`;
  }
  return null;
}
