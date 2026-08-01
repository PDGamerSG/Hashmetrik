/**
 * Shapes and parsing for the assistant, with no imports.
 *
 * Split out from `groq.ts` so the validation and the response parsing — the
 * parts worth testing — can be loaded by a plain Node test, while `groq.ts`
 * keeps the prompt, the network call and the environment it needs.
 */

export type ChatMessage = { role: "user" | "assistant"; text: string };

/** The last few turns only — the bubble is a short exchange, not a thread. */
export const MAX_HISTORY = 12;
export const MAX_MESSAGE_LENGTH = 500;

export function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (m.role === "user" || m.role === "assistant") && typeof m.text === "string";
}

/**
 * Pulls the reply out of a completion response.
 *
 * Every step is checked rather than reached through, so a response that isn't
 * the shape expected — an error body, a refusal with no content, a future
 * change to the API — fails as `null` here instead of arriving at the browser
 * as the word "undefined".
 */
export function extractReply(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  if (typeof content !== "string") return null;
  const trimmed = content.trim();
  return trimmed.length > 0 ? trimmed : null;
}
