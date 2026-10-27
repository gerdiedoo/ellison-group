import { queryValues } from "@/lib/validation";
import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{
    entity?: string;
    action?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const p = queryValues(await searchParams);
  const { db } = await requireStaff();
  let q = db
    .from("activity_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  const search = (p.q || "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .trim()
    .slice(0, 100);
  if (search)
    q = q.or(
      `entity_type.ilike.%${search}%,entity_id.ilike.%${search}%,action.ilike.%${search}%`,
    );
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
      <div className="ph">
        <div>
          <h1>Activity Log</h1>
          <p>Everything that happens to leads, inquiries and conversations.</p>
        </div>
      </div>
      <form className="toolbar">
        <input
          type="search"
          name="q"
          placeholder="Search activity or record"
          aria-label="Search activity"
          defaultValue={p.q}
        />
        <select name="entity" aria-label="Record type" defaultValue={p.entity}>
          <option value="">All record types</option>
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
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select name="action" aria-label="Operation" defaultValue={p.action}>
          <option value="">All operations</option>
          {["INSERT", "UPDATE", "DELETE"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <button className="btn sm">Filter</button>
        <span className="cnt">{count} operations</span>
      </form>
      <div className="tw rc">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Activity</th>
              <th>Record</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((a) => {
              const href = [
                "leads",
                "properties",
                "inquiries",
                "conversations",
              ].includes(a.entity_type)
                ? `/admin/${a.entity_type}/${a.entity_id}`
                : null;
              const details =
                a.details &&
                typeof a.details === "object" &&
                !Array.isArray(a.details) &&
                Array.isArray(a.details.changed_fields)
                  ? a.details.changed_fields.join(", ")
                  : "";
              return (
                <tr key={a.id}>
                  <td data-l="When" className="first">
                    {new Date(a.created_at).toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                    <div className="em">Central time</div>
                  </td>
                  <td data-l="Type">
                    <span className="badge s-Contacted">{a.action}</span>
                  </td>
                  <td data-l="Activity">
                    <div className="nm">
                      {a.entity_type.charAt(0).toUpperCase() +
                        a.entity_type.slice(1)}{" "}
                      {a.action === "INSERT"
                        ? "created"
                        : a.action === "DELETE"
                          ? "deleted"
                          : "updated"}
                    </div>
                    {details && <div className="em">Changed: {details}</div>}
                    <div className="em">
                      {a.actor_id
                        ? `Staff ${a.actor_id.slice(0, 8)}`
                        : "Server"}
                    </div>
                  </td>
                  <td data-l="Record">
                    {href ? (
                      <Link
                        style={{
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                        }}
                        href={href}
                      >
                        {a.entity_id}
                      </Link>
                    ) : (
                      <span className="em" style={{ overflowWrap: "anywhere" }}>
                        {a.entity_id}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!logs?.length && (
              <tr>
                <td colSpan={4}>
                  <div className="empty">
                    <b>No activity matches</b>Clear the filters.
                  </div>
                </td>
              </tr>
            )}
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
