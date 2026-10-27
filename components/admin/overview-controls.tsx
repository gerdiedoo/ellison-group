"use client";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { completeFollowup } from "@/app/actions/crm";
export function OverviewRange({ value }: { value: string }) {
  const router = useRouter();
  return (
    <label className="f" style={{ margin: 0 }}>
      <select
        aria-label="Date range"
        value={value}
        onChange={(e) => router.push("/admin?range=" + e.target.value)}
      >
        {[
          ["7", "Last 7 days"],
          ["30", "Last 30 days"],
          ["90", "Last 90 days"],
          ["all", "All time"],
        ].map(([v, label]) => (
          <option value={v} key={v}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function FollowupCheck({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(completeFollowup, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input
        type="checkbox"
        className="chk"
        aria-label={"Mark done: " + title}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      />
      {state.error && (
        <span role="alert" className="err">
          {state.error}
        </span>
      )}
    </form>
  );
}
