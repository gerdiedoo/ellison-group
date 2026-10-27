import { queryValues } from "@/lib/validation";
import { leadQuery, type LeadFilters } from "@/lib/crm-data";
import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { leadStatuses } from "@/lib/validation";
export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<LeadFilters>;
}) {
  const p = queryValues(await searchParams);
  const { db } = await requireStaff();
  const { data: team, error: teamError } = await db
    .from("profiles")
    .select("*")
    .in("role", ["agent", "admin"])
    .eq("active", true);
  if (teamError) throw new Error("Unable to load team");
  const query = leadQuery(db, p);
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
      <div className="sec-head">
        <h1>Leads</h1>
        <div className="inline">
          <Link className="btn solid" href="/admin/leads/new">
            Create lead
          </Link>
          <a
            className="btn ghost"
            href={"/admin/leads/export?" + new URLSearchParams({ ...p })}
          >
            Export CSV
          </a>
        </div>
      </div>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Search name, email or phone</label>
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
        <div className="field">
          <label htmlFor="source">Source</label>
          <select name="source" id="source" defaultValue={p.source}>
            <option value="">All sources</option>
            {["form", "chatbot", "manual", "google"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="since">Created since (UTC)</label>
          <input id="since" name="since" type="date" defaultValue={p.since} />
        </div>
        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select name="sort" id="sort" defaultValue={p.sort}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
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
