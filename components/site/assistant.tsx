"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; text: string };

/**
 * Slot for the AI assistant.
 *
 * The shell is finished — launcher, panel, transcript, composer, empty state,
 * keyboard handling — and it is wired to a single function, `sendMessage`
 * below. Replace that function's body with a call to your backend and the
 * feature is live; nothing else in this file needs to change.
 */
async function sendMessage(history: Message[]): Promise<string> {
  // TODO: point this at the assistant endpoint, e.g.
  //   const res = await fetch("/api/assistant", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ messages: history }),
  //   });
  //   if (!res.ok) throw new Error("Assistant unavailable");
  //   return (await res.json()).reply;
  void history;
  throw new Error("NOT_CONNECTED");
}

const PROMPTS = [
  "What would you do for a restaurant in Hyderabad?",
  "How is ROAS reported each month?",
  "What does a ₹3L monthly budget buy?",
];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [messages, pending]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const history: Message[] = [...messages, { role: "user", text: trimmed }];
    setMessages(history);
    setDraft("");
    setNotice(null);
    setPending(true);

    try {
      const reply = await sendMessage(history);
      setMessages([...history, { role: "assistant", text: reply }]);
    } catch (err) {
      setNotice(
        err instanceof Error && err.message === "NOT_CONNECTED"
          ? "The assistant isn't connected yet. Book a call and a strategist will answer this directly."
          : "That didn't send. Try again, or email info@hashmetrik.in.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {/* Launcher. Sits clear of the WhatsApp-style bottom-right corner on
          mobile by tucking above the safe area. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="assistant-panel"
        className={cn(
          "fixed right-4 bottom-4 z-50 flex h-13 items-center gap-2.5 rounded-sheet px-4 md:right-8 md:bottom-8",
          "font-mono text-[11px] uppercase tracking-[0.22em] shadow-[0_10px_30px_-12px_rgba(14,14,15,0.5)]",
          /* A ring, because the launcher floats over every surface on the
             site — including the coral tape, where it would otherwise have
             no edge at all. */
          "ring-2 ring-bone/90 transition-colors duration-300",
          open ? "bg-ink text-bone" : "bg-coral text-bone hover:bg-ink",
        )}
      >
        {open ? <X className="size-4" /> : <MessageSquare className="size-4" />}
        <span className={open ? "sr-only" : undefined}>Ask HashMetrik</span>
        {open && <span className="sr-only">Close assistant</span>}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label="Ask HashMetrik"
          className={cn(
            "fixed right-4 bottom-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col",
            "rounded-sheet border border-ash bg-bone-2 shadow-[0_24px_60px_-24px_rgba(14,14,15,0.45)]",
            "md:right-8 md:bottom-24",
          )}
        >
          <header className="flex items-center justify-between border-b border-ash px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate">
                Assistant
              </p>
              <p className="mt-1 font-display text-lg font-semibold tracking-[-0.02em]">
                Ask HashMetrik
              </p>
            </div>
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                pending ? "animate-pulse bg-gold" : "bg-coral",
              )}
            />
          </header>

          {/* `data-lenis-prevent` keeps the smooth scroller off this panel.
              Without it a wheel over the transcript scrolls the page behind
              the assistant instead of the conversation inside it. */}
          <div
            ref={transcriptRef}
            data-lenis-prevent
            className="max-h-[22rem] min-h-[12rem] overflow-y-auto px-5 py-5"
          >
            {messages.length === 0 && (
              <div>
                <p className="text-sm leading-relaxed text-slate">
                  Ask about services, timelines or what a budget actually buys. For anything
                  specific to your business, a strategist will pick it up.
                </p>
                <ul className="mt-5 space-y-2">
                  {PROMPTS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => submit(prompt)}
                        className="w-full rounded-sheet border border-ash px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:border-ink hover:bg-bone"
                      >
                        {prompt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="space-y-4">
              {messages.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "max-w-[85%] rounded-sheet px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-ink text-bone"
                      : "border border-ash bg-bone text-ink",
                  )}
                >
                  {m.text}
                </li>
              ))}
            </ul>

            {pending && (
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-slate">
                Thinking…
              </p>
            )}

            {notice && (
              <p
                role="status"
                className="mt-4 border-l-2 border-coral pl-3 text-sm leading-relaxed text-slate"
              >
                {notice}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(draft);
            }}
            className="flex items-center gap-2 border-t border-ash px-3 py-3"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message
            </label>
            <input
              ref={inputRef}
              id="assistant-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a question"
              maxLength={500}
              autoComplete="off"
              className="h-10 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-slate/70"
            />
            <button
              type="submit"
              disabled={pending || !draft.trim()}
              className="grid size-10 shrink-0 place-items-center rounded-sheet bg-coral text-bone transition-colors hover:bg-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <span className="sr-only">Send message</span>
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
