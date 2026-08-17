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

/**
 * Groq retires models, and a name it no longer serves comes back as a 400 that
 * surfaces to the visitor as "the assistant is unavailable" — so this constant
 * has a shelf life. `llama-3.3-70b-versatile` was the previous default and has
 * already been withdrawn. Check the models list before assuming this one is live.
 */
const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * How hard the model is allowed to think before answering.
 *
 * The gpt-oss models reason before replying, and those tokens are spent from the
 * same `max_tokens` budget the answer comes out of — left at its default, a
 * question worth a long answer spends most of the ceiling thinking and returns a
 * reply cut off mid-sentence. Measured against this endpoint: roughly 1,400
 * characters of reasoning at the default versus 150 at "low", which is the
 * difference between 446 and 1,488 characters of actual answer.
 *
 * Sent only to models that understand it — Groq rejects the parameter outright
 * on models that do not, so a future `GROQ_MODEL` change must not start
 * returning 400s because of a setting nobody remembered was here.
 */
function reasoningEffort(model: string): { reasoning_effort: string } | undefined {
  return model.includes("gpt-oss") ? { reasoning_effort: "low" } : undefined;
}

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

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        /* Low, because the job is answering questions about a real agency
           accurately, not writing. */
        temperature: 0.3,
        /* Matched to the system prompt, which asks for two or three sentences.
           Raising it would not lengthen a normal answer — it would only raise
           the ceiling on the rare question that wants an essay. */
        max_tokens: 400,
        ...reasoningEffort(model),
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
