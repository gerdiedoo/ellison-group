import { InboxTranscript } from "@/components/admin/inbox-transcript";
import { isRecordId } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { Area } from "@/lib/admin-fields";
import { StatusBadge } from "@/components/admin/ui";
import {
  updateConversation,
  replyConversation,
  addNote,
  updateNote,
  deleteNote,
} from "@/app/actions/crm";

export async function ConversationDetail({
  id,
  listUrl = "/admin/conversations",
}: {
  id: string;
  listUrl?: string;
}) {
  const { db, user } = await requireStaff();
  if (!isRecordId(id)) notFound();
  const [conversation, transcript, teamResult, notesResult] = await Promise.all(
    [
      db.from("conversations").select("*").eq("id", id).maybeSingle(),
      db
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
      db
        .from("profiles")
        .select("*")
        .in("role", ["agent", "admin"])
        .order("full_name"),
      db
        .from("notes")
        .select("*,author:profiles(full_name)")
        .eq("conversation_id", id)
        .order("created_at", { ascending: false }),
    ],
  );
  if (
    conversation.error ||
    transcript.error ||
    teamResult.error ||
    notesResult.error
  )
    throw new Error("Unable to load conversation");
  const c = conversation.data;
  if (!c) notFound();
  const [lead, property] = await Promise.all([
    c.lead_id
      ? db
          .from("leads")
          .select("id,full_name,email,phone,status")
          .eq("id", c.lead_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    c.property_id
      ? db
          .from("properties")
          .select("id,address,published,slug")
          .eq("id", c.property_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (lead.error || property.error)
    throw new Error("Unable to load conversation context");
  const l = lead.data,
    p = property.data,
    name = l?.full_name || "Anonymous visitor",
    team = teamResult.data || [];
  const actions =
    c.status === "resolved"
      ? [{ status: "bot", label: "Reopen", className: "btn sm" }]
      : [
          ...(c.status === "bot"
            ? [
                {
                  status: "human",
                  label: "Take over conversation",
                  className: "btn solid sm",
                },
              ]
            : [{ status: "bot", label: "Resume AI", className: "btn sm" }]),
          { status: "resolved", label: "Close", className: "btn sm ghost" },
        ];
  return (
    <section className="cd" aria-label="Conversation details">
      <div className="cd-h">
        <Link className="btn sm ghost back" href={listUrl}>
          ← All conversations
        </Link>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2 style={{ fontSize: 24 }}>{name}</h2>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>
              {l ? (
                <>
                  {l.email} · {l.phone} · <StatusBadge status={l.status} />
                </>
              ) : (
                "No contact details shared yet."
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <StatusBadge status={c.status} />
            {c.status === "human" && (
              <>
                {" "}
                <span className="badge c-Handed">Agent-managed</span>
              </>
            )}
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
              Started {date(c.created_at)}
            </div>
          </div>
        </div>
        <div className="cd-a">
          {actions.map((action) => (
            <ActionForm
              key={action.label}
              action={updateConversation}
              label={action.label}
              buttonClassName={action.className}
              className="quick-action"
            >
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value={action.status} />
              <input
                type="hidden"
                name="assigned_to"
                value={
                  c.assigned_to || (action.status === "human" ? user.id : "")
                }
              />
            </ActionForm>
          ))}
        </div>
        <div
          className="pill-row"
          style={{ marginTop: 12, alignItems: "center" }}
        >
          {l && (
            <Link className="btn sm ghost" href={"/admin/leads/" + l.id}>
              Open associated lead
            </Link>
          )}
          {p && (
            <Link className="chip" href={"/admin/properties/" + p.id}>
              {p.address}
            </Link>
          )}
        </div>
        <ActionForm
          action={updateConversation}
          className="pill-row inbox-handling"
          buttonClassName="btn sm ghost"
        >
          <input type="hidden" name="id" value={id} />
          <label className="f" style={{ margin: 0 }}>
            Handling
            <select
              aria-label="Handling (bot resumes automated replies)"
              name="status"
              defaultValue={c.status}
            >
              <option value="bot">Active · AI enabled</option>
              <option value="human">Handed to Agent · AI paused</option>
              <option value="resolved">Closed</option>
            </select>
          </label>
          <label className="f" style={{ margin: 0 }}>
            Agent
            <select
              name="assigned_to"
              aria-label="Assigned agent"
              defaultValue={c.assigned_to || ""}
            >
              <option value="">Unassigned</option>
              {team
                .filter((t) => t.active)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.id}
                  </option>
                ))}
            </select>
          </label>
        </ActionForm>
      </div>
      <InboxTranscript lastMessageId={transcript.data?.[0]?.id}>
        {transcript.data?.length ? (
          [...transcript.data].reverse().map((m) => (
            <div
              className={"mg " + (m.sender === "assistant" ? "bot" : m.sender)}
              key={m.id}
            >
              <small>
                {m.sender === "assistant"
                  ? "Assistant"
                  : m.sender === "visitor"
                    ? "Visitor"
                    : m.sender === "agent"
                      ? "Agent"
                      : "System"}{" "}
                · {time(m.created_at)}
              </small>
              <p>
                {m.body
                  .split(/(\/properties\/[a-z0-9-]+|\/home-valuation)/g)
                  .map((part, index) =>
                    part.startsWith("/properties/") ||
                    part === "/home-valuation" ? (
                      <Link key={index} href={part}>
                        {part}
                      </Link>
                    ) : (
                      part
                    ),
                  )}
              </p>
            </div>
          ))
        ) : (
          <div className="mg system">No messages.</div>
        )}
      </InboxTranscript>
      <div className="cd-f">
        {c.status === "human" ? (
          <ActionForm
            action={replyConversation}
            label="Send reply"
            className="inbox-reply"
            buttonClassName="btn solid sm"
          >
            <input type="hidden" name="conversation_id" value={id} />
            <input
              name="body"
              aria-label="Reply to visitor"
              placeholder="Reply to the visitor"
              maxLength={10000}
              required
              style={{ flex: 1, minWidth: 200 }}
            />
          </ActionForm>
        ) : (
          <p className="sub">
            {c.status === "resolved"
              ? "This conversation is closed. Reopen it to continue."
              : "Take over the conversation to reply personally. Automated replies are currently enabled."}
          </p>
        )}
        <h3 style={{ fontSize: 17, marginBottom: 8 }}>Internal notes</h3>
        <ActionForm
          action={addNote}
          label="Add note"
          className="inbox-note-form"
          buttonClassName="btn sm"
        >
          <input type="hidden" name="conversation_id" value={id} />
          <input
            name="body"
            aria-label="Internal note (staff only)"
            placeholder="Add a note for the team"
            maxLength={10000}
            required
            style={{ flex: 1, minWidth: 200 }}
          />
        </ActionForm>
        {notesResult.data?.map((n) => (
          <div className="note" key={n.id}>
            <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
            <div className="m">
              {n.author?.full_name || "Team"} · {date(n.created_at)}
            </div>
            <details style={{ marginTop: 6 }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: 12,
                }}
              >
                Edit note
              </summary>
              <ActionForm
                action={updateNote}
                label="Save note"
                buttonClassName="btn sm"
              >
                <input type="hidden" name="id" value={n.id} />
                <Area name="body" label="Edit note" value={n.body} />
              </ActionForm>
              <ActionForm
                action={deleteNote}
                label="Delete note"
                buttonClassName="btn sm danger"
              >
                <input type="hidden" name="id" value={n.id} />
              </ActionForm>
            </details>
          </div>
        ))}
        <p style={{ color: "var(--muted)", fontSize: 11.5, marginTop: 12 }}>
          Latest 200 messages. The visitor sees this same persistent history.
          Internal notes stay private.
        </p>
      </div>
    </section>
  );
}
function date(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}
function time(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}
