import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { ActionLink } from "@/components/site/button";
import { Tape } from "@/components/site/tape";
import { CONTACT, SOCIALS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to HashMetrik. Phone, email, WhatsApp and our Hyderabad studio — we reply within two business hours.",
  alternates: { canonical: "/contact" },
};

const ROWS = [
  { icon: Phone, label: "Call", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phone}` },
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Mail, label: "Alternate", value: CONTACT.emailAlt, href: `mailto:${CONTACT.emailAlt}` },
];

export default function ContactPage() {
  return (
    <>
      {/* A header strip, not a hero. The visitor came to fill in the form, so
          the page names itself in one line and hands the screen to the card:
          every field is on the first screen at 1366x768 and above. */}
      <section className="relative overflow-hidden border-b border-ash bg-bone">
        <div aria-hidden className="pointer-events-none absolute inset-0 grain text-ink" />
        <div className="shell relative flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 pt-6 pb-5 md:pt-8 md:pb-6">
          <h1 className="font-display text-4xl leading-[1.02] font-medium tracking-[-0.022em] md:text-5xl">
            Contact
          </h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-2 label text-slate">
            <span className="text-coral">Replies within two business hours</span>
            {/* Dropped where the line wraps — a rule stranded at the head of
                the second line reads as a bullet, not a separator. */}
            <span aria-hidden className="hidden h-px w-8 bg-ash sm:block" />
            <span>Hayathnagar, Hyderabad</span>
          </p>
        </div>
      </section>

      {/* `items-start` so the form card hugs its own height instead of
          stretching to match the taller aside beside it. */}
      <div className="shell grid items-start gap-10 pt-6 pb-14 md:pt-8 md:pb-20 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-14">
        <div className="rounded-sheet border border-ash bg-bone-2 p-5 sm:p-6 md:p-8">
          <ContactForm />
        </div>

        <aside className="rounded-sheet bg-ink p-6 text-bone md:p-7">
          <h2 className="font-display text-xl font-medium tracking-[-0.018em] md:text-2xl">
            Other ways to reach us
          </h2>

          <ul className="mt-6 border-t border-ash-ink">
            {ROWS.map((row) => (
              <li key={row.label} className="border-b border-ash-ink">
                <a
                  href={row.href}
                  className="group flex items-center gap-4 py-3.5 transition-colors hover:text-coral"
                >
                  <row.icon aria-hidden className="size-4 shrink-0 text-gold" />
                  <span className="w-20 shrink-0 label-sm text-bone/40">
                    {row.label}
                  </span>
                  <span className="text-sm text-bone/85 transition-colors group-hover:text-coral">
                    {row.value}
                  </span>
                </a>
              </li>
            ))}
            <li className="flex items-start gap-4 border-b border-ash-ink py-3.5">
              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
              <span className="w-20 shrink-0 label-sm text-bone/40">
                Studio
              </span>
              <span className="text-sm leading-relaxed text-bone/85">
                {CONTACT.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </li>
          </ul>

          {/* Side by side: two stacked bars cost a row of height the card
              cannot spare, and neither label needs the full width. */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ActionLink href={CONTACT.whatsapp} variant="gold" arrow={false}>
              <MessageCircle aria-hidden className="size-4" />
              WhatsApp
            </ActionLink>
            <ActionLink href="/book" variant="ghost-ink" arrow={false}>
              Book a call
            </ActionLink>
          </div>

          {/* Names only. The handles are a tap away on /links and in the
              footer, and spelling them here wraps the row onto a second line. */}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-ash-ink pt-5">
            {SOCIALS.map((s) => (
              <li key={s.code}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="label-sm text-bone/50 transition-colors hover:text-coral"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* The map is the one thing on this page nobody needs before they have
          written to us, so it comes off the card and runs wide below the fold
          — bigger than it ever was in the aside, and free of height up top. */}
      <section className="shell pb-14 md:pb-20">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-ash pt-4 label-sm text-slate">
          <span>Studio · Hayathnagar, Hyderabad</span>
          <a
            href={`https://www.google.com/maps?q=${CONTACT.mapQuery}`}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-coral"
          >
            Open in Google Maps
          </a>
        </div>

        {/* Bone background so a blocked or slow embed degrades to a blank
            sheet rather than a black hole in the middle of the page.
            `data-lenis-prevent` gives the map its pointer events back — the
            smooth scroller disables them on every iframe by default so a
            wheel over one is never swallowed, and this one is meant to pan. */}
        <div
          data-lenis-prevent
          className="relative mt-5 h-64 overflow-hidden rounded-sheet border border-ash bg-bone md:h-80"
        >
          <iframe
            title="Map of the HashMetrik studio in Hayathnagar, Hyderabad"
            src={`https://www.google.com/maps?q=${CONTACT.mapQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale-[0.85] contrast-[0.95]"
          />
        </div>
      </section>

      {/* The tape is a sign-off here, not a divider, so it costs nothing on
          the screen the form has to fit into. */}
      <Tape />
    </>
  );
}
