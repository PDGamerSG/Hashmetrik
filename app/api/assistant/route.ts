import { chat } from "@/lib/ai/groq";
import {
  MAX_HISTORY,
  MAX_MESSAGE_LENGTH,
  isChatMessage,
  type ChatMessage,
} from "@/lib/ai/reply";
import { consume } from "@/lib/rate-limit/store";
import { clientKey } from "@/lib/rate-limit/window";

/**
 * The homepage assistant.
 *
 * Public and unauthenticated, which is the whole risk: the endpoint spends a
 * free-tier API key on behalf of anyone who can post to it. Hence the cap
 * below, and a payload that is validated rather than trusted — the panel sends
 * a well-formed history, but the panel is not what has to be defended against.
 */
const LIMIT_PER_HOUR = 30;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send JSON." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isChatMessage)) {
    return Response.json({ error: "Send { messages: [{ role, text }] }." }, { status: 400 });
  }
  if (messages.length > MAX_HISTORY * 2) {
    return Response.json({ error: "That conversation is too long." }, { status: 400 });
  }
  if (messages.some((m: ChatMessage) => m.text.length > MAX_MESSAGE_LENGTH)) {
    return Response.json({ error: "That message is too long." }, { status: 400 });
  }

  /* A limiter that cannot reach the database must not silently stop limiting,
     but it must not take the assistant down either. Failing closed here would
     mean one bad query knocks out the feature for everyone; the exposure of
     failing open is bounded by Groq's own per-key rate limits. */
  try {
    const limit = await consume(`assistant:${clientKey(request.headers)}`, LIMIT_PER_HOUR);
    if (!limit.allowed) {
      return Response.json(
        { error: "That's a lot of questions for one hour. Book a call and a strategist will answer properly." },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error("[assistant] rate limit unavailable", error);
  }

  const result = await chat(messages);

  if (!result.ok) {
    if (result.reason === "unconfigured") {
      console.warn("[assistant] GROQ_API_KEY is not set");
      return Response.json({ error: "The assistant isn't connected." }, { status: 503 });
    }
    console.error("[assistant] upstream failed", result.detail);
    return Response.json({ error: "The assistant is unavailable." }, { status: 502 });
  }

  return Response.json({ reply: result.reply });
}
