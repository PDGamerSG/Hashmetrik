"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { submitLead } from "@/app/actions";
import { ActionButton, ActionLink } from "@/components/site/button";
import { Calendar, formatDate, toISODate } from "@/components/site/calendar";
import { Field, Input, Select, Textarea } from "@/components/site/field";
import { BOOKING_SERVICES, BUDGET_RANGES, TIME_SLOTS } from "@/lib/content";
import { cn } from "@/lib/utils";

const STEPS = ["Service", "Date", "Time", "Details"] as const;

type Details = {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  budget: string;
  message: string;
};

const EMPTY: Details = {
  name: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  industry: "",
  budget: "",
  message: "",
};

export function BookingFlow() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = BOOKING_SERVICES.find((s) => s.id === serviceId);

  const canAdvance = [Boolean(serviceId), Boolean(date), Boolean(time)][step] ?? false;

  const set = (patch: Partial<Details>) => setDetails((d) => ({ ...d, ...patch }));

  async function confirm(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const result = await submitLead({
      kind: "booking",
      name: details.name,
      email: details.email,
      phone: details.phone,
      company: details.company,
      website: details.website,
      industry: details.industry,
      service: service?.name,
      budget: details.budget,
      preferredDate: date ? toISODate(date) : undefined,
      preferredTime: time ?? undefined,
      message: details.message,
    });

    setPending(false);
    if (result.ok) setDone(true);
    else setError(result.error);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center md:py-24">
        <div className="mx-auto grid size-14 place-items-center rounded-sheet bg-gold">
          <Check aria-hidden className="size-6 text-ink" />
        </div>
        <h2 className="mt-8 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1] font-medium tracking-[-0.02em]">
          Your slot is held.
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate">
          A senior strategist will confirm by email within one business day. If anything changes
          before then, reply to that email and we&rsquo;ll move it.
        </p>

        <dl className="mx-auto mt-10 w-fit border-t border-ash text-left">
          <Reading label="Service" value={service?.name ?? "—"} />
          {date && <Reading label="Date" value={formatDate(date)} />}
          {time && <Reading label="Time" value={`${time} IST`} />}
          <Reading label="Confirmation" value={details.email} />
        </dl>

        <div className="mt-10">
          <ActionLink href="/" variant="outline" arrow={false}>
            Back to home
          </ActionLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 pt-6 pb-12 md:pt-8 md:pb-16 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14">
      {/* The steps lead on every screen: the docket below is a running
          summary, and an empty one is not worth the first screenful. */}
      <div>
        <Scale step={step} />

        {/* The rhythm of the flow is read off the viewport height: a laptop
            at 720 compresses so a six-row month still clears the fold, and
            anything taller keeps the site's normal spacing. */}
        <div className="mt-[clamp(1.25rem,3.4vh,2rem)]">
          {step === 0 && (
            <StepBody
              title="What should we talk about?"
              hint="Pick the closest fit. You can change direction on the call."
            >
              {/* Two up from the smallest screen, three once there is room:
                  all six have to be choosable without scrolling, so the
                  problem line is dropped where the height is tightest. */}
              <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                {BOOKING_SERVICES.map((s) => {
                  const active = serviceId === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => setServiceId(s.id)}
                        aria-pressed={active}
                        className={cn(
                          "h-full w-full rounded-sheet border p-4 text-left transition-colors sm:p-5",
                          active
                            ? "border-ink bg-ink text-bone"
                            : "border-ash bg-bone-2 hover:border-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "label-sm tabular sm:text-[11px]",
                            active ? "text-gold" : "text-coral",
                          )}
                        >
                          {s.code}
                        </span>
                        <span className="mt-2 block font-display text-base leading-tight font-medium tracking-[-0.012em] sm:mt-3 sm:text-lg">
                          {s.name}
                        </span>
                        <span
                          className={cn(
                            "mt-1.5 hidden text-sm leading-relaxed sm:block",
                            active ? "text-bone/60" : "text-slate",
                          )}
                        >
                          {s.desc}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </StepBody>
          )}

          {step === 1 && (
            <StepBody
              title="Pick a day"
              hint="Weekdays and Saturdays, 10:00 to 17:00 IST. Sundays closed."
            >
              <Calendar selected={date} onSelect={setDate} />
            </StepBody>
          )}

          {step === 2 && (
            <StepBody
              title="Pick a time"
              hint={date ? `Slots on ${formatDate(date)}` : "Choose a day first."}
            >
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {TIME_SLOTS.map((slot) => {
                  const active = time === slot;
                  return (
                    <li key={slot}>
                      <button
                        type="button"
                        onClick={() => setTime(slot)}
                        aria-pressed={active}
                        className={cn(
                          "h-12 w-full rounded-sheet border font-mono text-sm tabular transition-colors",
                          active
                            ? "border-ink bg-ink text-bone"
                            : "border-ash bg-bone-2 hover:border-ink",
                        )}
                      >
                        {slot}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </StepBody>
          )}

          {step === 3 && (
            <form onSubmit={confirm}>
              <StepBody title="Tell us about you" hint="Enough that we can prepare before the call.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" htmlFor="name">
                    <Input
                      id="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      value={details.name}
                      onChange={(e) => set({ name: e.target.value })}
                    />
                  </Field>
                  <Field label="Company" htmlFor="company">
                    <Input
                      id="company"
                      maxLength={120}
                      autoComplete="organization"
                      value={details.company}
                      onChange={(e) => set({ company: e.target.value })}
                    />
                  </Field>
                  <Field label="Email" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      required
                      maxLength={255}
                      autoComplete="email"
                      value={details.email}
                      onChange={(e) => set({ email: e.target.value })}
                    />
                  </Field>
                  <Field label="Phone" htmlFor="phone">
                    <Input
                      id="phone"
                      type="tel"
                      required
                      maxLength={20}
                      autoComplete="tel"
                      value={details.phone}
                      onChange={(e) => set({ phone: e.target.value })}
                    />
                  </Field>
                  <Field label="Website" htmlFor="website">
                    <Input
                      id="website"
                      maxLength={200}
                      placeholder="https://"
                      value={details.website}
                      onChange={(e) => set({ website: e.target.value })}
                    />
                  </Field>
                  <Field label="Industry" htmlFor="industry">
                    <Input
                      id="industry"
                      maxLength={80}
                      value={details.industry}
                      onChange={(e) => set({ industry: e.target.value })}
                    />
                  </Field>
                  <Field label="Monthly marketing budget" htmlFor="budget" className="sm:col-span-2">
                    <Select
                      id="budget"
                      value={details.budget}
                      onChange={(e) => set({ budget: e.target.value })}
                    >
                      <option value="">Not sure yet</option>
                      {BUDGET_RANGES.map((range) => (
                        <option key={range}>{range}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="What isn't working right now?"
                    htmlFor="message"
                    className="sm:col-span-2"
                  >
                    <Textarea
                      id="message"
                      rows={4}
                      maxLength={1000}
                      placeholder="What you've tried, and what you'd want to change first."
                      value={details.message}
                      onChange={(e) => set({ message: e.target.value })}
                    />
                  </Field>
                </div>

                {error && (
                  <p role="alert" className="mt-6 border-l-2 border-coral pl-4 text-sm text-ink">
                    {error}
                  </p>
                )}

                <div className="mt-10 flex items-center justify-between gap-4">
                  <BackButton onClick={() => setStep(2)} />
                  <ActionButton type="submit" disabled={pending} arrow={false}>
                    {pending ? "Confirming…" : "Confirm booking"}
                    <Check aria-hidden className="size-4" />
                  </ActionButton>
                </div>
              </StepBody>
            </form>
          )}

          {step < 3 && (
            <div className="mt-[clamp(1rem,2.6vh,1.5rem)] flex items-center justify-between gap-4">
              <BackButton onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} />
              <ActionButton
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                disabled={!canAdvance}
                arrow={false}
              >
                Continue
                <ArrowRight aria-hidden className="size-4" />
              </ActionButton>
            </div>
          )}
        </div>
      </div>

      {/* The docket. Everything chosen so far, kept visible as a running
          reading rather than hidden behind a review step. */}
      <aside>
        <div className="rounded-sheet border border-ash bg-bone-2 p-6 lg:sticky lg:top-28">
          <p className="label-sm text-slate">
            Your booking
          </p>
          <dl className="mt-5 border-t border-ash">
            <Reading label="Service" value={service?.name} />
            <Reading label="Date" value={date ? formatDate(date) : undefined} />
            <Reading label="Time" value={time ? `${time} IST` : undefined} />
            <Reading label="Length" value="30 minutes" />
            <Reading label="Cost" value="Free" />
          </dl>
        </div>
      </aside>
    </div>
  );
}

/** The stepper, drawn as a scale: each step is a mark you have passed. */
function Scale({ step }: { step: number }) {
  return (
    <ol className="flex gap-1.5">
      {STEPS.map((label, i) => {
        const passed = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex-1">
            <div
              className={cn(
                "h-0.5 w-full transition-colors duration-300",
                passed ? "bg-ink" : active ? "bg-coral" : "bg-ash",
              )}
            />
            <p
              className={cn(
                "mt-3 label-sm tabular",
                active ? "text-ink" : "text-slate",
              )}
            >
              <span className="hidden sm:inline">{String(i + 1).padStart(2, "0")} </span>
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function StepBody({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-[clamp(1.5rem,3.2vw,2.25rem)] leading-[1.08] font-medium tracking-[-0.02em]">
        {title}
      </h2>
      {hint && <p className="mt-2 text-sm text-slate md:text-base">{hint}</p>}
      <div className="mt-[clamp(1rem,2.6vh,1.5rem)]">{children}</div>
    </div>
  );
}

function BackButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-12 items-center gap-2 label text-slate transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-30"
    >
      <ArrowLeft aria-hidden className="size-4" />
      Back
    </button>
  );
}

function Reading({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ash py-3">
      <dt className="label-sm text-slate">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm",
          value ? "font-medium text-ink" : "font-mono text-slate/50",
        )}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
