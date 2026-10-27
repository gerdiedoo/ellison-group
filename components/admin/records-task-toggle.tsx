"use client";
import { useActionState, useRef } from "react";
import type { ActionState } from "@/components/action-form";
import { updateTask } from "@/app/actions/crm";
import type { Task } from "@/lib/database.types";
export function RecordsTaskToggle({ task }: { task: Task }) {
  const form = useRef<HTMLFormElement>(null),
    [state, action, pending] = useActionState(
      async (previous: ActionState, data: FormData) => {
        const result = await updateTask(previous, data);
        if (result.error) form.current?.reset();
        return result;
      },
      {},
    );
  return (
    <form ref={form} action={action} className="li">
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="title" value={task.title} />
      <input type="hidden" name="due_at" value={task.due_at.slice(0, 10)} />
      <input type="hidden" name="assigned_to" value={task.assigned_to || ""} />
      <input
        type="checkbox"
        className="chk"
        name="done"
        defaultChecked={task.done}
        aria-label={"Done: " + task.title}
        disabled={pending}
        onChange={() => form.current?.requestSubmit()}
      />
      <div className="b">
        <div
          className="t"
          style={
            task.done
              ? { textDecoration: "line-through", color: "var(--muted)" }
              : undefined
          }
        >
          {task.title}
        </div>
        <div className="m">
          {pending
            ? "Saving…"
            : task.done
              ? "Completed"
              : "Due " +
                new Date(task.due_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "America/Chicago",
                })}
        </div>
        {state.error && (
          <div className="err" role="alert">
            {state.error}
          </div>
        )}
      </div>
    </form>
  );
}
