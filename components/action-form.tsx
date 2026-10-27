"use client";
import { startTransition, useActionState } from "react";
export type ActionState = { error?: string; success?: string; href?: string };
export function ActionForm({
  action,
  children,
  label = "Save changes",
  className = "stack",
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  label?: string;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return (
    <form
      action={submit}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        // Manual dispatch preserves uncontrolled input values after validation errors.
        startTransition(() => submit(data));
      }}
    >
      {children}
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice" role="status">
          {state.success}{" "}
          {state.href && (
            <a className="link" href={state.href}>
              Open record →
            </a>
          )}
        </p>
      )}
      <button className="btn solid" disabled={pending}>
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}
