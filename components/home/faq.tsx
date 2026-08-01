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
        {/* The head holds its place while the questions run past it. The list
            is the taller column by some margin, so a head that scrolls away
            leaves six questions on screen with nothing saying what they are
            answering — and takes the booking CTA with it. `items-start` is
            what lets the sticky child work: a grid item stretches to the row
            by default, and a full-height box has nothing to stick within. */}
        <div className="grid gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
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
                      className="group flex w-full items-start gap-5 py-6 text-left"
                    >
                      <span
                        className={cn(
                          "mt-1.5 label tabular transition-colors duration-300",
                          isOpen ? "text-coral" : "text-slate",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 font-display text-lg leading-snug font-medium tracking-[-0.012em] transition-colors duration-300 group-hover:text-coral group-active:text-coral md:text-xl">
                        {faq.q}
                      </span>
                      {/* The plus sits in a disc, the way every arrow on this
                          site sits in one. Closed it is a hairline ring; open
                          it fills and the plus becomes a minus in the same
                          quarter turn. A bare icon in a list of six was the
                          one control on the page with no target drawn around
                          it. */}
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-300 ease-[var(--ease-out-quint)]",
                          isOpen
                            ? "border-coral bg-coral text-bone"
                            : "border-ash text-coral group-hover:border-coral/60 group-hover:bg-coral/10",
                        )}
                      >
                        <Plus
                          className={cn(
                            "size-4 transition-transform duration-300 ease-[var(--ease-out-quint)]",
                            isOpen && "rotate-45",
                          )}
                        />
                      </span>
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
