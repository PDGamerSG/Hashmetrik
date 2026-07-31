"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { submitLead } from "@/app/actions";
import { ActionButton, ActionLink } from "@/components/site/button";
import { Field, Input, Textarea } from "@/components/site/field";
import { CONTACT } from "@/lib/content";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* The minimum height is roughly that of the form it replaces, so the card
     does not collapse under the reader when the message goes. */
  if (sent) {
    return (
      <div className="flex min-h-[22rem] flex-col justify-center py-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-sheet bg-gold">
          <Check aria-hidden className="size-6 text-ink" />
        </div>
        <h2 className="mt-8 font-display text-3xl font-medium tracking-[-0.018em]">
          Message received.
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-slate">
          We reply within two business hours. If it is urgent, WhatsApp is faster than email.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ActionLink href="/book">Book a consultation</ActionLink>
          <ActionLink href={CONTACT.whatsapp} variant="outline" arrow={false}>
            WhatsApp us
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Names the card, so it reads as a peer of the aside beside it rather
          than a stack of fields with no title. The brief itself is asked for
          by the message placeholder, which saves a line of height here. */}
      <h2 className="mb-6 font-display text-2xl font-medium tracking-[-0.018em]">
        Send us a brief
      </h2>

      {/* Two up at every width: these four are short enough to pair, and
          stacking them on a phone is what pushes the send button off the
          screen. */}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;

          const data = new FormData(event.currentTarget);
          setPending(true);
          setError(null);

          const result = await submitLead({
            kind: "contact",
            name: String(data.get("name") ?? ""),
            email: String(data.get("email") ?? ""),
            phone: String(data.get("phone") ?? ""),
            company: String(data.get("company") ?? ""),
            message: String(data.get("message") ?? ""),
          });

          setPending(false);
          if (result.ok) setSent(true);
          else setError(result.error);
        }}
        className="grid grid-cols-2 gap-4"
      >
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" required maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Company" htmlFor="company">
          <Input id="company" name="company" maxLength={120} autoComplete="organization" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            required
            maxLength={255}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" />
        </Field>
        <Field label="What can we help with?" htmlFor="message" className="col-span-2">
          <Textarea
            id="message"
            name="message"
            rows={4}
            required
            maxLength={1000}
            placeholder="The business, the goal, and what has been tried so far."
          />
        </Field>

        {error && (
          <p role="alert" className="col-span-2 border-l-2 border-coral pl-4 text-sm text-ink">
            {error}
          </p>
        )}

        <div className="col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xs text-xs leading-relaxed text-slate">
            We use your details to reply to this message and nothing else.
          </p>
          <ActionButton type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send message"}
          </ActionButton>
        </div>
      </form>
    </>
  );
}
