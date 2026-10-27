import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { isRecordId, pageNumber, queryValues } from "@/lib/validation";
import { ConversationDetail } from "@/components/conversation-detail";
import { AutoRefresh } from "@/components/auto-refresh";
import { EmptyState, PageHeading, StatusBadge } from "@/components/admin/ui";

export async function ConversationInbox({
  selectedId,
  filters = {},
}: {
  selectedId?: string;
  filters?: Record<string, unknown>;
}) {
  const { db } = await requireStaff();
  if (selectedId && !isRecordId(selectedId)) notFound();
  const p = queryValues(filters);
  const page = pageNumber(p.page);
  let query = db
    .rpc(
      "search_conversations",
      { p_query: (p.q || "").slice(0, 100) },
      { count: "exact" },
    )
    .select("id,status,assigned_to,lead_id,updated_at")
    .order("updated_at", { ascending: false });
  if (["bot", "human", "resolved"].includes(p.status))
    query = query.eq("status", p.status as "bot" | "human" | "resolved");
  if (p.agent === "unassigned") query = query.is("assigned_to", null);
  else if (isRecordId(p.agent)) query = query.eq("assigned_to", p.agent);
  const [result, teamResult] = await Promise.all([
    query.range((page - 1) * 50, page * 50 - 1),
    db
      .from("profiles")
      .select("*")
      .in("role", ["agent", "admin"])
      .order("full_name"),
  ]);
  if (result.error || teamResult.error) throw new Error("Unable to load inbox");
  const conversations = result.data || [],
    team = teamResult.data || [];
  const leadIds = [
    ...new Set(conversations.flatMap((c) => (c.lead_id ? [c.lead_id] : []))),
  ];
  const [leads, previews] = await Promise.all([
    leadIds.length
      ? db.from("leads").select("id,full_name").in("id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    conversations.length
      ? db
          .from("conversations")
          .select("id,messages(body,sender,created_at)")
          .in(
            "id",
            conversations.map((c) => c.id),
          )
          .order("created_at", {
            referencedTable: "messages",
            ascending: false,
          })
          .limit(1, { referencedTable: "messages" })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (leads.error || previews.error)
    throw new Error("Unable to load inbox contacts");
  const selected = selectedId || conversations[0]?.id;
  const listUrl = "/admin/conversations?" + new URLSearchParams(p);
  return (
    <>
      <AutoRefresh />
      <PageHeading
        title="Conversations"
        description="AI chatbot conversations from the public site."
      />
      <div className={"cv " + (selectedId ? "hasd" : "")}>
        <aside className="cl" aria-label="Conversation inbox">
          <form
            className="toolbar"
            action={
              selectedId
                ? "/admin/conversations/" + selectedId
                : "/admin/conversations"
            }
          >
            <input
              type="search"
              name="q"
              defaultValue={p.q}
              placeholder="Search visitor or message"
              aria-label="Search visitor or messages"
            />
            <select name="status" defaultValue={p.status} aria-label="Handling">
              <option value="">All statuses</option>
              <option value="bot">Active</option>
              <option value="human">Handed to Agent</option>
              <option value="resolved">Closed</option>
            </select>
            <select name="agent" defaultValue={p.agent} aria-label="Agent">
              <option value="">All agents</option>
              <option value="unassigned">Unassigned</option>
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
            <button className="btn sm ghost">Apply</button>
          </form>
          <div className="scroll">
            {conversations.map((c) => {
              const name =
                leads.data?.find((l) => l.id === c.lead_id)?.full_name ||
                "Anonymous visitor";
              const message = previews.data?.find((item) => item.id === c.id)
                ?.messages?.[0];
              return (
                <Link
                  className={"ci " + (selected === c.id ? "on" : "")}
                  href={
                    "/admin/conversations/" +
                    c.id +
                    "?" +
                    new URLSearchParams(p)
                  }
                  key={c.id}
                  aria-label={"Open conversation with " + name}
                >
                  <span
                    className="av"
                    style={{
                      background: c.lead_id ? "var(--moss)" : "#8a8f87",
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="b">
                    <div className="t">
                      <b>{name}</b>
                      <span>{relative(c.updated_at)}</span>
                    </div>
                    <div className="pv">
                      {message
                        ? (message.sender === "visitor"
                            ? ""
                            : message.sender === "agent"
                              ? "Agent: "
                              : "Bot: ") + message.body
                        : "No messages yet"}
                    </div>
                    <div className="pill-row">
                      <StatusBadge status={c.status} />
                      <span
                        className="em"
                        style={{ color: "var(--muted)", fontSize: 12 }}
                      >
                        {team.find((t) => t.id === c.assigned_to)?.full_name ||
                          "Unassigned"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
            {!conversations.length && (
              <EmptyState
                title="No conversations"
                description="Try clearing the filters."
              />
            )}
          </div>
          <nav
            className="toolbar"
            aria-label="Conversation pagination"
            style={{
              borderTop: "1px solid var(--line)",
              borderBottom: 0,
              justifyContent: "space-between",
            }}
          >
            <small style={{ color: "var(--muted)" }}>
              {result.count || 0} conversations
            </small>
            <span className="pill-row">
              {page > 1 && (
                <Link
                  className="btn sm ghost"
                  href={
                    "/admin/conversations?" +
                    new URLSearchParams({ ...p, page: String(page - 1) })
                  }
                >
                  Previous
                </Link>
              )}
              {page * 50 < (result.count || 0) && (
                <Link
                  className="btn sm ghost"
                  href={
                    "/admin/conversations?" +
                    new URLSearchParams({ ...p, page: String(page + 1) })
                  }
                >
                  Next
                </Link>
              )}
            </span>
          </nav>
        </aside>
        {selected ? (
          <ConversationDetail id={selected} listUrl={listUrl} />
        ) : (
          <section className="cd">
            <EmptyState
              title="Select a conversation"
              description="Its transcript and actions appear here."
            />
          </section>
        )}
      </div>
    </>
  );
}
function relative(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 60000),
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
}
