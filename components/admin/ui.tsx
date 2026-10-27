import type { ReactNode, CSSProperties } from "react";
export function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="ph">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <b>{title}</b>
      {description}
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const names: Record<string, string> = {
    bot: "Active",
    human: "Handed to agent",
    resolved: "Closed",
  };
  const text = names[status] || status;
  return (
    <span
      className={`badge ${status in names ? "c" : "s"}-${text.split(" ")[0]}`}
    >
      {text}
    </span>
  );
}
export const sourceColors: Record<string, string> = {
  google: "#3d5a47",
  form: "#a04a2f",
  chatbot: "#c7a76a",
  manual: "#6a746d",
};
export function SourceLabel({ source }: { source: string }) {
  return (
    <span
      className="src"
      style={{ "--c": sourceColors[source] || "#6a746d" } as CSSProperties}
    >
      {(
        {
          google: "Google sign-in",
          form: "Contact form",
          chatbot: "AI chatbot",
          manual: "Manual",
        } as Record<string, string>
      )[source] || source}
    </span>
  );
}
export const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
