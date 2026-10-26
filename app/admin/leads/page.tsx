import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { leadStatuses } from "@/lib/validation";
export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    agent?: string;
    page?: string;
  }>;
}) {
  const p = await searchParams;
  const { db } = await requireStaff();
  const { data: team } = await db
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"])
    .eq("active", true);
  let query = db
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  const q = (p.q || "").replace(/[%_,().]/g, " ").slice(0, 100);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  if (p.status) query = query.eq("status", p.status);
  if (p.agent)
    query =
      p.agent === "unassigned"
        ? query.is("assigned_to", null)
        : query.eq("assigned_to", p.agent);
  const page = pageNumber(p.page);
  const {
    data: leads,
    count,
    error,
  } = await query.range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Unable to load leads");
  const pageUrl = (n: number) =>
    "/admin/leads?" + new URLSearchParams({ ...p, page: String(n) }).toString();
  return (
    <>
      <h1>Leads</h1>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Search name or email</label>
          <input id="q" name="q" defaultValue={p.q} />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={p.status}>
            <option value="">All statuses</option>
            {leadStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="agent">Agent</label>
          <select id="agent" name="agent" defaultValue={p.agent}>
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {team?.map((t) => (
              <option value={t.id} key={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn solid">Apply</button>
        <Link href="/admin/leads" className="text-button">
          Clear
        </Link>
      </form>
      <p>{count} leads</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Source</th>
              <th>Agent</th>
            </tr>
          </thead>
          <tbody>
            {leads?.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link href={"/admin/leads/" + l.id}>{l.full_name}</Link>
                </td>
                <td>
                  {l.email}
                  <br />
                  {l.phone}
                </td>
                <td>
                  <span className="badge">{l.status}</span>
                </td>
                <td>{l.source}</td>
                <td>
                  {team?.find((t) => t.id === l.assigned_to)?.full_name ||
                    "Unassigned"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!leads?.length && (
        <p className="empty">No leads match the current filters.</p>
      )}
      <div className="toolbar">
        {page > 1 && (
          <Link className="btn" href={pageUrl(page - 1)}>
            Previous
          </Link>
        )}
        {page * 50 < (count || 0) && (
          <Link className="btn" href={pageUrl(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
