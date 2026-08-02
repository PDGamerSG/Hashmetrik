import { CONTACT, FAQS, PILLARS, SERVICES, SITE } from "@/lib/content";

/**
 * The assistant's system prompt, assembled from the same content file the site
 * renders.
 *
 * Written this way rather than as a pasted block of prose so the two cannot
 * drift: when a service is renamed or the phone number changes, the assistant
 * changes with the page instead of confidently quoting last quarter's copy.
 */
export function buildSystemPrompt(
  /**
   * The admin-editable half, from `/admin/assistant`.
   *
   * Appended rather than substituted, and appended *after* the standing rules
   * so that "never invent a price" cannot be talked out of the model by
   * something typed into a settings box. The site's own content stays the
   * backbone of the prompt; this adds to it.
   */
  extras: { knowledge?: string; instructions?: string } = {},
): string {
  const services = SERVICES.map(
    (s) => `- ${s.name} (${s.code}): ${s.problem} Delivers: ${s.outcomes.join(", ")}.`,
  ).join("\n");

  const pillars = PILLARS.map((p) => `- ${p.name}: ${p.claim}`).join("\n");

  const faqs = FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");

  const knowledge = extras.knowledge?.trim()
    ? `\n\nADDITIONAL FACTS\nThese are true and may be stated. If one contradicts anything above, prefer this section.\n${extras.knowledge.trim()}`
    : "";

  const instructions = extras.instructions?.trim()
    ? `\n\nADDITIONAL INSTRUCTIONS\n${extras.instructions.trim()}`
    : "";

  return `You are the assistant on ${SITE.name}'s website. ${SITE.description}

THE PACKAGE
${pillars}

SERVICES
${services}

CONTACT
Phone ${CONTACT.phoneDisplay}. Email ${CONTACT.email}. Based in Hyderabad, India.
Consultations are booked at /book — a short form that takes a service, a date and a time.

REFERENCE ANSWERS
${faqs}

HOW TO ANSWER
- Be brief. Two or three sentences unless asked for more.
- Plain British English. No emoji, no exclamation marks, no marketing adjectives.
- Never invent prices, timelines, guarantees, client names or case studies. If the
  answer would need a number you have not been given, say what it depends on and
  point to a consultation at /book.
- Anything specific to the visitor's own business — audit, strategy, budget split —
  belongs with a strategist. Say so and point to /book.
- If a question is outside marketing and this agency, say it is outside what you can
  help with.
- You are not able to book, cancel or look anything up. Do not imply otherwise.${knowledge}${instructions}`;
}
