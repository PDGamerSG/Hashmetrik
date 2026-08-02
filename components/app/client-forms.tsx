"use client";

import { useState } from "react";
import { Textarea } from "@/components/site/field";
import { SubmitButton } from "@/components/app/ui";
import { comment, decide, decideCalendar } from "@/app/(app)/dashboard/actions";

/**
 * The client's two decisions: on a deliverable, and on a planned post.
 *
 * Approve is a single button with no note, because approval is the common case
 * and making somebody write a sentence to say "yes" is how approvals stop
 * happening. Requesting changes opens a box, because a change request without a
 * reason is a round trip wasted.
 */
export function DeliverableDecision({ id, status }: { id: string; status: string }) {
  const [asking, setAsking] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={decide}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="approved" />
          <SubmitButton>{status === "approved" ? "Approved" : "Approve"}</SubmitButton>
        </form>

        <button
          type="button"
          onClick={() => setAsking((open) => !open)}
          aria-expanded={asking}
          className="h-10 rounded-sheet border border-ash px-4 text-[13px] text-ink transition-colors hover:border-ink hover:bg-bone-2"
        >
          Request changes
        </button>
      </div>

      {asking && (
        <form action={decide} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="changes_requested" />
          <label htmlFor={`note-${id}`} className="label-sm text-slate">
            What needs to change?
          </label>
          <Textarea id={`note-${id}`} name="note" rows={3} required maxLength={2000} />
          <SubmitButton>Send it back</SubmitButton>
        </form>
      )}

      <form action={comment} className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <label htmlFor={`comment-${id}`} className="label-sm text-slate">
          Add a comment
        </label>
        <Textarea id={`comment-${id}`} name="body" rows={2} maxLength={2000} />
        <SubmitButton variant="quiet">Post comment</SubmitButton>
      </form>
    </div>
  );
}

export function CalendarDecision({ id, status }: { id: string; status: string }) {
  const [asking, setAsking] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={decideCalendar}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="approved" />
          <SubmitButton>{status === "approved" ? "Approved" : "Approve"}</SubmitButton>
        </form>

        <button
          type="button"
          onClick={() => setAsking((open) => !open)}
          aria-expanded={asking}
          className="h-10 rounded-sheet border border-ash px-4 text-[13px] text-ink transition-colors hover:border-ink hover:bg-bone-2"
        >
          Request changes
        </button>
      </div>

      {asking && (
        <form action={decideCalendar} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="changes_requested" />
          <label htmlFor={`cal-note-${id}`} className="label-sm text-slate">
            What needs to change?
          </label>
          <Textarea id={`cal-note-${id}`} name="note" rows={3} required maxLength={500} />
          <SubmitButton>Send it back</SubmitButton>
        </form>
      )}
    </div>
  );
}
