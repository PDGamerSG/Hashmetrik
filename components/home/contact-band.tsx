import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Section, Accent } from "@/components/site/section";
import { ActionLink } from "@/components/site/button";
import { Tape } from "@/components/site/tape";
import { CONTACT } from "@/lib/content";

const ROWS = [
  { icon: Phone, label: "Call", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phone}` },
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Mail, label: "Alternate", value: CONTACT.emailAlt, href: `mailto:${CONTACT.emailAlt}` },
  {
    icon: MapPin,
    label: "Studio",
    value: CONTACT.addressLines.join(", "),
    href: `https://www.google.com/maps?q=${CONTACT.mapQuery}`,
  },
];

export function ContactBand() {
  return (
    <>
      <Tape tone="gold" reverse />

      <Section id="contact" reading="06" label="Get in touch" tone="ink">
        <div className="py-20 md:py-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-20">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-coral">
                Get in touch
              </p>
              <h2 className="mt-5 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.04em] text-balance">
                Let&rsquo;s map your next <Accent>growth quarter</Accent>.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-bone/65 md:text-lg">
                Thirty minutes, no obligation. You leave with a written growth thesis for your
                brand within 48 hours — whether or not you hire us.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ActionLink href="/book" className="h-14 px-7">
                  Book a free consultation
                </ActionLink>
                <ActionLink
                  href={CONTACT.whatsapp}
                  variant="ghost-ink"
                  className="h-14 px-7"
                  arrow={false}
                >
                  <MessageCircle aria-hidden className="size-4" />
                  WhatsApp us
                </ActionLink>
              </div>

              <ul className="mt-12 border-t border-ash-ink">
                {ROWS.map((row) => (
                  <li key={row.label} className="border-b border-ash-ink">
                    <a
                      href={row.href}
                      target={row.href.startsWith("http") ? "_blank" : undefined}
                      rel={row.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-start gap-4 py-4 transition-colors hover:text-coral"
                    >
                      <row.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-[0.22em] text-bone/40">
                        {row.label}
                      </span>
                      <span className="text-sm leading-relaxed text-bone/85 transition-colors group-hover:text-coral">
                        {row.value}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pt-16">
              {/* Paper inset on the ink surface. The bone background is load
                  bearing: an embed that is slow, blocked or offline otherwise
                  leaves a black rectangle sitting in the middle of the
                  section. This way the worst case is a blank sheet with the
                  address still legible beneath it. */}
              <div className="relative aspect-square overflow-hidden rounded-sheet border border-ash-ink bg-bone">
                <iframe
                  title="Map of the HashMetrik studio in Hayathnagar, Hyderabad"
                  src={`https://www.google.com/maps?q=${CONTACT.mapQuery}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.85] contrast-[0.95]"
                />
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-bone/40">
                Hayathnagar, Hyderabad — visits by appointment
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
