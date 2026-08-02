import { buildSystemPrompt } from "./prompt";
import { MAX_HISTORY, MAX_MESSAGE_LENGTH, extractReply, type ChatMessage } from "./reply";

/**
 * Groq, through its OpenAI-compatible chat completions endpoint.
 *
 * No SDK: one POST, one JSON shape. Not streamed either — the panel in
 * `components/site/assistant.tsx` awaits a finished string, and streaming would
 * mean rewriting working UI for no visible gain at this volume.
 */
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; reason: "unconfigured" | "upstream"; detail?: string };

export async function chat(
  history: ChatMessage[],
  /* The admin-editable half of the prompt, read by the caller. Passed in rather
     than fetched here so this module stays one HTTP call with no database
     behind it, and so a test can drive it without a settings table. */
  extras: { knowledge?: string; instructions?: string } = {},
): Promise<ChatResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { ok: false, reason: "unconfigured" };

  const messages = [
    { role: "system" as const, content: buildSystemPrompt(extras) },
    ...history.slice(-MAX_HISTORY).map((m) => ({
      role: m.role,
      content: m.text.slice(0, MAX_MESSAGE_LENGTH),
    })),
  ];

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages,
        /* Low, because the job is answering questions about a real agency
           accurately, not writing. */
        temperature: 0.3,
        max_tokens: 400,
      }),
      /* Groq is fast; a request still running after fifteen seconds is a
         request the visitor has already given up on. */
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      return { ok: false, reason: "upstream", detail: `${res.status} ${await res.text()}` };
    }

    const reply = extractReply(await res.json());
    if (!reply) return { ok: false, reason: "upstream", detail: "empty completion" };

    return { ok: true, reply };
  } catch (error) {
    return { ok: false, reason: "upstream", detail: String(error) };
  }
}
