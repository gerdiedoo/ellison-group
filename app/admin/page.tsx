import Link from "next/link";
import { requireStaff } from "@/lib/auth";
export default async function Dashboard() {
  const { db } = await requireStaff();
  const tables = [
    "leads",
    "inquiries",
    "properties",
    "conversations",
    "tasks",
  ] as const;
  const results = await Promise.all(
    tables.map((t) => db.from(t).select("id", { count: "exact" }).limit(1)),
  );
  if (results.some((r) => r.error || r.count === null))
    throw new Error("Unable to load dashboard");
  const { data: tasks, error } = await db
    .from("tasks")
    .select("*")
    .eq("done", false)
    .order("due_at")
    .limit(10);
  const { data: activity, error: ae } = await db
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);
  if (error || ae) throw new Error("Unable to load activity");
  return (
    <>
      <span className="eyebrow">Your workspace</span>
      <h1>A considered overview.</h1>
      <div className="grid">
        {tables.map((t, i) => (
          <Link
            className="card"
            href={t === "tasks" ? "/admin/leads" : "/admin/" + t}
            key={t}
          >
            <span className="eyebrow">{t}</span>
            <div className="metric">{results[i].count ?? 0}</div>
            <small>All stored records</small>
          </Link>
        ))}
      </div>
      <h2>Upcoming follow-ups</h2>
      <div className="stack">
        {tasks?.length ? (
          tasks.map((t) => (
            <Link
              className="card"
              href={"/admin/leads/" + t.lead_id}
              key={t.id}
            >
              {t.title}
              <span className="muted">
                {" "}
                · Due{" "}
                {new Date(t.due_at).toLocaleDateString("en-US", {
                  timeZone: "America/Chicago",
                })}
              </span>
            </Link>
          ))
        ) : (
          <p className="empty">No open follow-up tasks.</p>
        )}
      </div>
      <h2>Recent activity</h2>
      {activity?.map((a) => (
        <p key={a.id}>
          {a.action} · {a.entity_type} ·{" "}
          <time>
            {new Date(a.created_at).toLocaleString("en-US", {
              timeZone: "America/Chicago",
            })}
          </time>
        </p>
      ))}
    </>
  );
}
