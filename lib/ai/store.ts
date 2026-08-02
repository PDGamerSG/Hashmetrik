import "server-only";

import { prisma } from "@/lib/db";
import { readSettings } from "@/lib/settings/store";

/**
 * What the assistant is told, and what it was asked.
 *
 * Two jobs that belong together because they are the same feedback loop: an
 * administrator reads the conversations, notices an answer that was wrong or a
 * question the site does not answer, and writes the correction into the
 * knowledge base a few lines up the page.
 */

export type AssistantConfig = { knowledge: string; instructions: string };

/**
 * The admin-editable half of the prompt.
 *
 * Never throws: the assistant answering from the site's own content is a working
 * assistant, and a settings table that is briefly unreachable should not turn
 * the bubble into an error message.
 */
export async function readAssistantConfig(): Promise<AssistantConfig> {
  try {
    const values = await readSettings();
    return {
      knowledge: values["assistant.knowledge"] ?? "",
      instructions: values["assistant.instructions"] ?? "",
    };
  } catch (error) {
    console.error("[assistant] config unavailable", error);
    return { knowledge: "", instructions: "" };
  }
}

/**
 * Records one question and its answer, returning the conversation it belongs to.
 *
 * The id is handed back to the panel and posted with the next question, which is
 * what turns a series of requests into a readable thread. It is not trusted: a
 * posted id that does not exist starts a new conversation rather than failing,
 * because the alternative is a visitor whose assistant stops working because
 * their tab is older than a cleanup.
 *
 * Best-effort throughout. The reply has already been produced and shown; losing
 * the record of it is a smaller failure than turning a good answer into an
 * error, so every path here returns rather than throws.
 */
export async function recordExchange(input: {
  conversationId?: string | null;
  userId?: string | null;
  question: string;
  answer: string;
}): Promise<string | null> {
  try {
    const existing = input.conversationId
      ? await prisma.assistantConversation.findUnique({
          where: { id: input.conversationId },
          select: { id: true },
        })
      : null;

    const conversation =
      existing ??
      (await prisma.assistantConversation.create({
        data: { userId: input.userId ?? null },
        select: { id: true },
      }));

    await prisma.assistantMessage.createMany({
      data: [
        { conversationId: conversation.id, role: "user", body: input.question },
        { conversationId: conversation.id, role: "assistant", body: input.answer },
      ],
    });

    await prisma.assistantConversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return conversation.id;
  } catch (error) {
    console.error("[assistant] exchange not recorded", error);
    return null;
  }
}

/** The most recently active conversations, whole, for the admin screen. */
export async function listConversations(take = 40) {
  return prisma.assistantConversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    take,
    select: {
      id: true,
      createdAt: true,
      lastMessageAt: true,
      user: { select: { id: true, name: true, email: true } },
      messages: {
        select: { id: true, role: true, body: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function countConversations() {
  const [conversations, messages] = await Promise.all([
    prisma.assistantConversation.count(),
    prisma.assistantMessage.count({ where: { role: "user" } }),
  ]);
  return { conversations, questions: messages };
}
