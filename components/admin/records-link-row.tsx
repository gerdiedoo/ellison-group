"use client";
import { useRouter } from "next/navigation";
export function RecordsLinkRow({
  href,
  children,
  label,
}: {
  href: string;
  children: React.ReactNode;
  label: string;
}) {
  const router = useRouter();
  return (
    <tr
      className="row"
      tabIndex={0}
      aria-label={label}
      onClick={(event) => {
        if (
          !(event.target as HTMLElement).closest(
            "a,button,input,select,textarea,summary",
          )
        )
          router.push(href);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target === event.currentTarget)
          router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
