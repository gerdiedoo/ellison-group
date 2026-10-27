"use client";
import { useFormStatus } from "react-dom";
export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  className = "btn solid",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
