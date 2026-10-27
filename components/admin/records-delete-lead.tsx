"use client";
import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/app/actions/crm";
import type { ActionState } from "@/components/action-form";
export function RecordsDeleteLead({
  id,
  name,
  compact = false,
}: {
  id: string;
  name: string;
  compact?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    router = useRouter();
  const [state, action, pending] = useActionState(
    async (previous: ActionState, form: FormData) => {
      const result = await deleteLead(previous, form);
      if (result.success) {
        dialog.current?.close();
        router.push("/admin/leads");
        router.refresh();
      }
      return result;
    },
    {},
  );
  return (
    <>
      <button
        type="button"
        className={"btn danger" + (compact ? " sm" : "")}
        onClick={() => dialog.current?.showModal()}
        aria-label={compact ? "Delete " + name : undefined}
      >
        <Trash2 size={16} />
        {compact ? "Delete" : "Delete lead"}
      </button>
      <dialog
        className="cfm"
        ref={dialog}
        aria-label="Delete lead confirmation"
      >
        <h3>Delete lead?</h3>
        <p>
          {name} and their inquiries, notes and reminders will be removed. Audit
          records remain.
        </p>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <label style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input
              type="checkbox"
              name="confirm"
              required
              aria-label="Confirm permanent lead deletion"
            />
            I confirm permanent deletion.
          </label>
          {state.error && (
            <p className="err" role="alert">
              {state.error}
            </p>
          )}
          <div className="a">
            <button
              className="btn ghost"
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button className="btn danger" disabled={pending}>
              {pending ? "Deleting…" : "Delete lead"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
