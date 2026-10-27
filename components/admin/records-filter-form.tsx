"use client";
import { useRef, useEffect, useTransition, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
export function RecordsFilterForm({ children }: { children: ReactNode }) {
  const router = useRouter(),
    pathname = usePathname(),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    [pending, start] = useTransition();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function apply(form: HTMLFormElement) {
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form))
      if (typeof value === "string" && value) query.set(key, value);
    start(() =>
      router.replace(pathname + "?" + query.toString(), { scroll: false }),
    );
  }
  return (
    <form
      className="toolbar"
      role="search"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        apply(event.currentTarget);
      }}
      onChange={(event) => {
        if (timer.current) clearTimeout(timer.current);
        const form = event.currentTarget;
        if (event.target instanceof HTMLSelectElement) apply(form);
        else timer.current = setTimeout(() => apply(form), 300);
      }}
    >
      {children}
    </form>
  );
}
