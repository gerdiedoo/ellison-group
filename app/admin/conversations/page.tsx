import { queryValues, isRecordId } from "@/lib/validation";
import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { AutoRefresh } from "@/components/auto-refresh";
export default async function Inbox({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    agent?: string;
    page?: string;
  }>;
}) {
  const p = queryValues(await searchParams);
  const { db } = await requireStaff();
  let q = db
    .rpc(
      "search_conversations",
      { p_query: (p.q || "").slice(0, 100) },
      { count: "exact" },
    )
    .select("id,status,assigned_to,lead_id,updated_at")
    .order("updated_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status as "bot" | "human" | "resolved");
  if (p.agent === "unassigned" || isRecordId(p.agent))
    q =
      p.agent === "unassigned"
        ? q.is("assigned_to", null)
        : q.eq("assigned_to", p.agent);
  const page = pageNumber(p.page);
  const [
    { data: conversations, count, error },
    { data: team, error: teamError },
  ] = await Promise.all([
    q.range((page - 1) * 50, page * 50 - 1),
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
  ]);
  if (error || teamError) throw new Error("Unable to load inbox");
  const leadIds = [
    ...new Set(
      conversations?.flatMap((c) => (c.lead_id ? [c.lead_id] : [])) || [],
    ),
  ];
  const agentIds = [
    ...new Set(
      conversations?.flatMap((c) => (c.assigned_to ? [c.assigned_to] : [])) ||
        [],
    ),
  ];
  const [leads, agents] = await Promise.all([
    leadIds.length
      ? db.from("leads").select("id,full_name").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    agentIds.length
      ? db.from("profiles").select("id,full_name").in("id", agentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (leads.error || agents.error)
    throw new Error("Unable to load inbox contacts");
  const url = (n: number) =>
    "/admin/conversations?" + new URLSearchParams({ ...p, page: String(n) });
  return (
    <>
      <AutoRefresh />
      <h1>Conversation inbox</h1>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Search visitor or messages</label>
          <input id="q" name="q" defaultValue={p.q} />
        </div>
        <div className="field">
          <label htmlFor="status">Handling</label>
          <select id="status" name="status" defaultValue={p.status}>
            <option value="">All states</option>
            {["bot", "human", "resolved"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="agent">Agent</label>
          <select name="agent" id="agent" defaultValue={p.agent}>
            <option value="">All agents</option>
            <option value="unassigned">Unassigned</option>
            {team?.map((t) => (
              <option value={t.id} key={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn">Apply</button>
      </form>
      <p>{count} conversations</p>
      <div className="stack">
        {conversations?.map((c) => (
          <Link
            className="card"
            href={"/admin/conversations/" + c.id}
            key={c.id}
          >
            <span className="badge">{c.status}</span>
            <h2>
              {leads.data?.find((l) => l.id === c.lead_id)?.full_name ||
                "Anonymous visitor"}
            </h2>
            <p>
              {agents.data?.find((a) => a.id === c.assigned_to)?.full_name ||
                "Unassigned"}{" "}
              · Updated {c.updated_at}
            </p>
          </Link>
        ))}
      </div>
      {!conversations?.length && (
        <p className="empty">No conversations match the current filters.</p>
      )}
      <div className="toolbar">
        {page > 1 && (
          <Link className="btn" href={url(page - 1)}>
            Previous
          </Link>
        )}
        {page * 50 < (count || 0) && (
          <Link className="btn" href={url(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
