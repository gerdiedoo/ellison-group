"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
export function RecordsPropertyDrawer({
  title,
  description,
  location,
  closeHref,
  children,
}: {
  title: string;
  description: string;
  location: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const drawer = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") router.replace(closeHref, { scroll: false });
      if (event.key === "Tab") {
        const controls = drawer.current?.querySelectorAll<HTMLElement>(
          'a[href],button,input,select,textarea,[tabindex="0"]',
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [closeHref, router]);
  return (
    <>
      <button
        className="scrim on"
        aria-label="Close property details"
        onClick={() => router.replace(closeHref, { scroll: false })}
      />
      <aside
        ref={drawer}
        className="drawer on"
        role="dialog"
        aria-modal="true"
        aria-label={"Property details for " + title}
      >
        <div className="dh">
          <div>
            <div
              className="m"
              style={{
                color: "var(--muted)",
                fontSize: 12,
                letterSpacing: ".1em",
                textTransform: "uppercase",
              }}
            >
              {description}
            </div>
            <h2 style={{ fontSize: 26 }}>{title}</h2>
            <div style={{ color: "var(--muted)" }}>{location}</div>
          </div>
          <button
            ref={close}
            className="btn sm ghost"
            onClick={() => router.replace(closeHref, { scroll: false })}
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="db">{children}</div>
      </aside>
    </>
  );
}
