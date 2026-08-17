import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Section, Accent } from "@/components/site/section";
import { ActionLink } from "@/components/site/button";
import { Tape } from "@/components/site/tape";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Magnetic } from "@/components/motion/magnetic";
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
              <p className="label text-coral">
                Get in touch
              </p>
              <SplitHeading
                as="h2"
                className="mt-5 font-display text-[clamp(2.25rem,6vw,4.5rem)] leading-[0.98] font-medium tracking-[-0.022em] text-balance"
              >
                <>
                  Let&rsquo;s map your next <Accent>growth quarter</Accent>.
                </>
              </SplitHeading>

              <Reveal>
                <p className="mt-6 max-w-md text-base leading-relaxed text-bone/65 md:text-lg">
                  Thirty minutes, no obligation. You leave with a written growth thesis for your
                  brand within 48 hours — whether or not you hire us.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Magnetic className="w-full sm:w-auto">
                    <ActionLink href="/book" variant="bone" size="lg" className="w-full">
                      Book a free consultation
                    </ActionLink>
                  </Magnetic>
                  <Magnetic className="w-full sm:w-auto">
                    <ActionLink
                      href={CONTACT.whatsapp}
                      variant="ghost-ink"
                      size="lg"
                      className="w-full"
                      arrow={false}
                    >
                      <MessageCircle aria-hidden className="size-4" />
                      WhatsApp us
                    </ActionLink>
                  </Magnetic>
                </div>
              </Reveal>

              <Reveal as="ul" stagger={0.06} y={16} className="mt-12 border-t border-ash-ink">
                {ROWS.map((row) => (
                  <li key={row.label} className="border-b border-ash-ink">
                    <a
                      href={row.href}
                      target={row.href.startsWith("http") ? "_blank" : undefined}
                      rel={row.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group flex items-start gap-4 py-4 transition-colors hover:text-coral active:text-coral"
                    >
                      <row.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span className="w-24 shrink-0 label text-bone/40">
                        {row.label}
                      </span>
                      <span className="text-sm leading-relaxed text-bone/85 transition-colors group-hover:text-coral group-active:text-coral">
                        {row.value}
                      </span>
                    </a>
                  </li>
                ))}
              </Reveal>
            </div>

            <Reveal className="lg:pt-16" y={36} scale={0.97}>
              {/* Paper inset on the ink surface. The bone background is load
                  bearing: an embed that is slow, blocked or offline otherwise
                  leaves a black rectangle sitting in the middle of the
                  section. This way the worst case is a blank sheet with the
                  address still legible beneath it.

                  `data-lenis-prevent` hands the wheel back to the map: Lenis
                  disables pointer events on every iframe by default so a
                  scroll over one is never swallowed, and this is the one
                  iframe on the site that is meant to be panned. */}
              <div
                data-lenis-prevent
                className="relative aspect-square overflow-hidden rounded-sheet border border-ash-ink bg-bone"
              >
                <iframe
                  title="Map of the Hashmetrik studio in Hayathnagar, Hyderabad"
                  src={`https://www.google.com/maps?q=${CONTACT.mapQuery}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 grayscale-[0.85] contrast-[0.95]"
                />
              </div>
              <p className="mt-4 label text-bone/40">
                Hayathnagar, Hyderabad — visits by appointment
              </p>
            </Reveal>
          </div>
        </div>
      </Section>
    </>
  );
}
