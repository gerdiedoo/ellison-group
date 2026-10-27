"use client";
import { useActionState, useRef } from "react";
import type { ActionState } from "@/components/action-form";
import { updateInquiry } from "@/app/actions/crm";
import { inquiryStatuses } from "@/lib/validation";
export function RecordsInquiryStatus({
  id,
  status,
  assigned,
}: {
  id: string;
  status: string;
  assigned: string | null;
}) {
  const form = useRef<HTMLFormElement>(null),
    [state, action, pending] = useActionState(
      async (previous: ActionState, data: FormData) => {
        const result = await updateInquiry(previous, data);
        if (result.error) form.current?.reset();
        return result;
      },
      {},
    );
  return (
    <form ref={form} action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="assigned_to" value={assigned || ""} />
      <select
        name="status"
        aria-label="Inquiry status"
        defaultValue={status}
        disabled={pending}
        onChange={() => form.current?.requestSubmit()}
      >
        {inquiryStatuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      {state.error && (
        <div className="err" role="alert">
          {state.error}
        </div>
      )}
    </form>
  );
}
