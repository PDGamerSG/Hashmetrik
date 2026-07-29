"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { Section, SectionHead, Accent } from "@/components/site/section";
import { ActionLink } from "@/components/site/button";
import { Reveal } from "@/components/motion/reveal";
import { EASE_OUT_QUINT } from "@/lib/motion";
import { FAQS } from "@/lib/content";
import { cn } from "@/lib/utils";

export function Faq() {
  /* One open at a time — the answers are short, and a fully expanded list
     buries the booking CTA underneath it. */
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq" reading="05" label="Questions">
      <div className="py-20 md:py-28">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
          <div>
            <SectionHead
              reading="05"
              eyebrow="Questions"
              title={
                <>
                  Answered <Accent>before</Accent> you ask.
                </>
              }
              desc="Anything not covered here, a strategist will answer on the call — including whether we are the wrong fit."
            />
            <ActionLink href="/book" className="mt-9">
              Book a free consultation
            </ActionLink>
          </div>

          <Reveal as="ul" stagger={0.05} y={18} className="border-t border-ash">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <li key={faq.q} className="border-b border-ash">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      className="flex w-full items-start gap-5 py-6 text-left"
                    >
                      <span className="mt-1.5 font-mono text-[11px] tracking-[0.22em] tabular text-slate">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-display text-lg leading-snug font-semibold tracking-[-0.02em] md:text-xl">
                        {faq.q}
                      </span>
                      <Plus
                        aria-hidden
                        className={cn(
                          "mt-1 size-5 shrink-0 text-coral transition-transform duration-300",
                          isOpen && "rotate-45",
                        )}
                      />
                    </button>
                  </h3>
                  {/* Height is the one layout property worth animating on
                      this site: an answer that appears instantly shoves the
                      questions below it down the page with no indication of
                      where they went. It is bounded — six short answers, one
                      open at a time — so the reflow stays cheap. */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="panel"
                        id={`faq-panel-${i}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.42, ease: EASE_OUT_QUINT }}
                        className="overflow-hidden"
                      >
                        <p className="pr-8 pb-7 pl-[3.6rem] text-base leading-relaxed text-slate">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
