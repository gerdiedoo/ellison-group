import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; page?: string }>;
}) {
  const p = await searchParams;
  const { db } = await requireStaff();
  let q = db
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (p.entity) q = q.eq("entity_type", p.entity);
  if (p.action) q = q.eq("action", p.action);
  const page = pageNumber(p.page);
  const {
    data: logs,
    count,
    error,
  } = await q.range((page - 1) * 100, page * 100 - 1);
  if (error) throw new Error("Unable to load audit log");
  const url = (n: number) =>
    "/admin/activity?" + new URLSearchParams({ ...p, page: String(n) });
  return (
    <>
      <h1>Activity Log</h1>
      <p>
        Server-created records of significant changes. Audit records cannot be
        edited through this application.
      </p>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="entity">Record type</label>
          <select name="entity" id="entity" defaultValue={p.entity}>
            <option value="">All</option>
            {[
              "profiles",
              "leads",
              "properties",
              "inquiries",
              "conversations",
              "messages",
              "notes",
              "tasks",
              "settings",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="action">Operation</label>
          <select name="action" id="action" defaultValue={p.action}>
            <option value="">All</option>
            {["INSERT", "UPDATE", "DELETE"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <button className="btn">Filter</button>
      </form>
      <p>{count} operations</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Operation</th>
              <th>Record</th>
              <th>Actor</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((a) => (
              <tr key={a.id}>
                <td>{a.created_at}</td>
                <td>{a.action}</td>
                <td>
                  {a.entity_type}
                  <br />
                  {a.entity_id}
                </td>
                <td>{a.actor_id || "Server"}</td>
                <td>{JSON.stringify(a.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="toolbar">
        {page > 1 && (
          <Link className="btn" href={url(page - 1)}>
            Previous
          </Link>
        )}
        {page * 100 < (count || 0) && (
          <Link className="btn" href={url(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
