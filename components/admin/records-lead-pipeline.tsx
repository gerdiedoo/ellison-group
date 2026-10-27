"use client";
import { useActionState, useRef } from "react";
import type { ActionState } from "@/components/action-form";
import { updateLeadPipeline } from "@/app/actions/crm";
import { leadStatuses } from "@/lib/validation";
import type { Profile } from "@/lib/database.types";
export function RecordsLeadPipeline({
  id,
  status,
  assigned,
  team,
}: {
  id: string;
  status: string;
  assigned: string | null;
  team: Profile[];
}) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    async (previous: ActionState, data: FormData) => {
      const result = await updateLeadPipeline(previous, data);
      if (result.error) form.current?.reset();
      return result;
    },
    {},
  );
  return (
    <form
      ref={form}
      action={action}
      onChange={() => form.current?.requestSubmit()}
    >
      <input type="hidden" name="id" value={id} />
      <label className="f" style={{ marginTop: 12 }}>
        Status
        <select
          aria-label="Status"
          name="status"
          defaultValue={status}
          disabled={pending}
        >
          {leadStatuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="f">
        Assigned agent
        <select
          aria-label="Assigned agent"
          name="assigned_to"
          defaultValue={assigned || ""}
          disabled={pending}
        >
          <option value="">Unassigned</option>
          {team
            .filter((t) => t.active && t.role !== "visitor")
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
        </select>
      </label>
      {state.error && (
        <p className="err" role="alert">
          {state.error}
        </p>
      )}
      {pending && (
        <p className="m" role="status">
          Saving pipeline…
        </p>
      )}
    </form>
  );
}
