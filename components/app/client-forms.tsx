"use client";

import { useState } from "react";
import { Textarea } from "@/components/site/field";
import { Button, SubmitButton } from "@/components/app/button";
import { comment, decide, decideCalendar } from "@/app/(app)/dashboard/actions";

/**
 * The client's two decisions: on a deliverable, and on a planned post.
 *
 * Approve is a single button with no note, because approval is the common case
 * and making somebody write a sentence to say "yes" is how approvals stop
 * happening. Requesting changes opens a box, because a change request without a
 * reason is a round trip wasted.
 *
 * Every submit here posts an action that returns nothing, so the buttons carry
 * their own pending state from `useFormStatus` — see `components/app/button.tsx`
 * for why that had to stop being each page's problem.
 */

/** Shared by both decisions: the note box that opens under "Request changes". */
function ChangeNote({
  id,
  action,
  maxLength,
}: {
  id: string;
  action: (formData: FormData) => Promise<void>;
  maxLength: number;
}) {
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value="changes_requested" />
      <label htmlFor={`note-${id}`} className="label-sm text-slate">
        What needs to change?
      </label>
      <Textarea id={`note-${id}`} name="note" rows={3} required maxLength={maxLength} />
      <SubmitButton busyLabel="Sending…">Send it back</SubmitButton>
    </form>
  );
}

function Decision({
  id,
  status,
  action,
  maxLength,
}: {
  id: string;
  status: string;
  action: (formData: FormData) => Promise<void>;
  maxLength: number;
}) {
  const [asking, setAsking] = useState(false);
  const approved = status === "approved";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="approved" />
          {/* Already approved: the button stays as the record of what was
              decided, but pressing it again would post a second identical
              decision and a second notification to the team. */}
          <SubmitButton disabled={approved} busyLabel="Approving…">
            {approved ? "Approved" : "Approve"}
          </SubmitButton>
        </form>

        <Button
          type="button"
          variant="quiet"
          onClick={() => setAsking((open) => !open)}
          aria-expanded={asking}
        >
          {asking ? "Cancel" : "Request changes"}
        </Button>
      </div>

      {asking && <ChangeNote id={id} action={action} maxLength={maxLength} />}
    </div>
  );
}

export function DeliverableDecision({ id, status }: { id: string; status: string }) {
  return (
    <div className="space-y-5">
      <Decision id={id} status={status} action={decide} maxLength={2000} />

      <form action={comment} className="space-y-2">
        <input type="hidden" name="id" value={id} />
        <label htmlFor={`comment-${id}`} className="label-sm text-slate">
          Add a comment
        </label>
        {/* `required` because the action drops an empty body and returns
            nothing — so posting a blank box used to reload the page and leave
            no trace, which is indistinguishable from the button being broken.
            The browser now refuses before the round trip. */}
        <Textarea id={`comment-${id}`} name="body" rows={2} required maxLength={2000} />
        <SubmitButton variant="quiet" busyLabel="Posting…">
          Post comment
        </SubmitButton>
      </form>
    </div>
  );
}

export function CalendarDecision({ id, status }: { id: string; status: string }) {
  return <Decision id={id} status={status} action={decideCalendar} maxLength={500} />;
}
