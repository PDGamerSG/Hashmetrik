import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { readSettings, settingsIn } from "@/lib/settings/store";
import { countConversations, listConversations } from "@/lib/ai/store";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { saveSettings } from "../settings/actions";
import { Field, Textarea } from "@/components/site/field";
import {
  Alert,
  Card,
  Empty,
  PageHeader,
  Pill,
  Readout,
  Readouts,
  Section,
  SectionTitle,
  SubmitButton,
  formatCount,
  formatDateTime,
} from "@/components/app/ui";

export const metadata: Metadata = { title: "Assistant" };
export const dynamic = "force-dynamic";

/**
 * The growth assistant: what it knows, what it is told, and what it was asked.
 *
 * The three sit on one page because they are one loop. An administrator reads a
 * conversation, finds a question the site does not answer or an answer that was
 * wrong, and writes the correction into the box at the top of the same screen.
 * Splitting them across three routes would put a scroll between the problem and
 * the place it is fixed.
 *
 * The prompt itself is not editable, and the preview at the bottom says why: the
 * backbone is assembled from `lib/content.ts`, the same file the public pages
 * render, so a renamed service changes the assistant with the page instead of
 * leaving it quoting last quarter's copy. What an admin adds is appended after
 * the standing rules, where it cannot talk the model out of "never invent a
 * price".
 */
export default async function AdminAssistantPage() {
  await requireAdmin();

  let values: Record<string, string> = {};
  let conversations: Awaited<ReturnType<typeof listConversations>> = [];
  let tally = { conversations: 0, questions: 0 };
  let failure: string | null = null;

  try {
    const [settings, rows, counts] = await Promise.all([
      readSettings(),
      listConversations(40),
      countConversations(),
    ]);
    values = settings;
    conversations = rows;
    tally = counts;
  } catch (error) {
    console.error("[admin] assistant unavailable", error);
    failure = "The database is unreachable. Check DATABASE_URL — see docs/backend-setup.md.";
  }

  const connected = Boolean(process.env.GROQ_API_KEY);
  const preview = buildSystemPrompt({
    knowledge: values["assistant.knowledge"],
    instructions: values["assistant.instructions"],
  });

  return (
    <>
      <PageHeader
        title="Assistant"
        meta="What the bubble on the public site knows, is told, and has been asked."
        actions={
          connected ? (
            <Pill tone="good" dot>
              Connected
            </Pill>
          ) : (
            <Pill tone="warn" dot>
              No API key
            </Pill>
          )
        }
      />

      <Readouts className="lg:grid-cols-3">
        <Readout
          label="Questions"
          value={formatCount(tally.questions)}
          note="Asked by visitors and signed-in clients"
        />
        <Readout
          label="Conversations"
          value={formatCount(tally.conversations)}
          note="A session with the bubble, however long"
        />
        <Readout
          label="Per conversation"
          value={
            tally.conversations === 0
              ? "—"
              : (tally.questions / tally.conversations).toFixed(1)
          }
          note="Questions before a visitor stops"
        />
      </Readouts>

      {failure && (
        <div className="mt-8">
          <Alert>{failure}</Alert>
        </div>
      )}

      {!connected && (
        <div className="mt-8">
          <Alert>
            <code className="text-ink">GROQ_API_KEY</code> is not set, so the bubble on the site
            tells visitors the assistant isn&rsquo;t connected. Everything on this page still
            saves and will be in the prompt the moment a key is added.
          </Alert>
        </div>
      )}

      <Card className="mt-8">
        <SectionTitle>Knowledge base and instructions</SectionTitle>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Both are appended to the prompt built from the site&rsquo;s own services, pillars and
          FAQs — so anything already on a public page does not need repeating here. Put facts in
          the first box and behaviour in the second.
        </p>

        <form action={saveSettings} className="mt-5 grid gap-5">
          {settingsIn("assistant").map((setting) => (
            <Field
              key={setting.key}
              label={setting.label}
              htmlFor={setting.key}
              hint={setting.hint}
            >
              <Textarea
                id={setting.key}
                name={setting.key}
                rows={setting.key === "assistant.knowledge" ? 10 : 5}
                defaultValue={values[setting.key] ?? ""}
                maxLength={setting.max}
              />
            </Field>
          ))}
          <div>
            <SubmitButton>Save</SubmitButton>
          </div>
        </form>
      </Card>

      <Section title="Conversations" count={conversations.length}>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate">
          The most recently active first. Guests are not identified beyond what they typed — no
          address of any kind is stored — and a signed-in visitor is named because their account
          already is.
        </p>

        {conversations.length === 0 ? (
          <Empty>
            Nothing yet. Every exchange with the bubble on the public site is recorded here.
          </Empty>
        ) : (
          <ul className="mt-5 space-y-4">
            {conversations.map((conversation) => {
              const asked = conversation.messages.filter((m) => m.role === "user").length;

              return (
                <Card as="li" key={conversation.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-ink">
                      {conversation.user
                        ? (conversation.user.name ?? conversation.user.email)
                        : "Guest"}
                      <span className="ml-2 font-normal text-slate">
                        {asked} question{asked === 1 ? "" : "s"}
                      </span>
                    </p>
                    <p className="tabular label-xs text-slate">
                      {formatDateTime(conversation.lastMessageAt)}
                    </p>
                  </div>

                  {/* A transcript reads as a transcript: who spoke in the
                      margin, what they said in the column. Run together on one
                      line, a long answer and the next question became one
                      paragraph. */}
                  <ol className="mt-4 space-y-3 border-t border-ash pt-4">
                    {conversation.messages.map((message) => (
                      <li
                        key={message.id}
                        className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 text-sm leading-relaxed"
                      >
                        <span className="label-xs pt-1 text-slate">
                          {message.role === "user" ? "Asked" : "Replied"}
                        </span>
                        <span className={message.role === "user" ? "text-ink" : "text-slate"}>
                          {message.body}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="The prompt as it stands">
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate">
          Read-only. The backbone is assembled from <code className="text-ink">lib/content.ts</code>
          , the same file the public pages render, so the two cannot drift; what you save above is
          appended at the end.
        </p>
        <pre className="mt-5 max-h-96 overflow-auto rounded-sheet border border-ash bg-bone-2 p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate">
          {preview}
        </pre>
      </Section>
    </>
  );
}
