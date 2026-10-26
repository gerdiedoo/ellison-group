import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { Select, Assignment, Area } from "@/lib/admin-fields";
import {
  updateConversation,
  replyConversation,
  addNote,
} from "@/app/actions/crm";
export async function ConversationDetail({ id }: { id: string }) {
  const { db } = await requireStaff();
  const [
    { data: c, error },
    { data: messages, error: me },
    { data: team },
    { data: notes },
  ] = await Promise.all([
    db.from("conversations").select("*").eq("id", id).maybeSingle(),
    db
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
    db
      .from("notes")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (error || me) throw new Error("Unable to load conversation");
  if (!c) notFound();
  return (
    <>
      <AutoRefresh />
      <Link className="link" href="/admin/conversations">
        ← Inbox
      </Link>
      <h1>Conversation</h1>
      {c.lead_id && (
        <Link className="btn ghost" href={"/admin/leads/" + c.lead_id}>
          Open associated lead
        </Link>
      )}
      <div className="two-cols">
        <div>
          <h2>Transcript</h2>
          <p className="muted">
            Latest 200 messages. The visitor sees this same history.
          </p>
          <div className="stack">
            {messages?.reverse().map((m) => (
              <div className={"message " + m.sender} key={m.id}>
                <small>
                  {m.sender} · {m.created_at}
                </small>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
          {c.status === "human" ? (
            <ActionForm action={replyConversation} label="Send reply">
              <input type="hidden" name="conversation_id" value={id} />
              <Area name="body" label="Reply to visitor" />
            </ActionForm>
          ) : (
            <p className="notice">
              Enable human handling to reply. Bot handling: {c.status}.
            </p>
          )}
        </div>
        <div className="stack">
          <div className="card">
            <h2>Handling & assignment</h2>
            <ActionForm action={updateConversation}>
              <input type="hidden" name="id" value={id} />
              <Select
                name="status"
                label="Handling (bot resumes automated replies)"
                options={["bot", "human", "resolved"]}
                value={c.status}
              />
              <Assignment team={team || []} value={c.assigned_to} />
            </ActionForm>
          </div>
          <div className="card">
            <h2>Internal notes</h2>
            {notes?.map((n) => (
              <p className="notice" key={n.id}>
                {n.body}
              </p>
            ))}
            <ActionForm action={addNote} label="Add note">
              <input type="hidden" name="conversation_id" value={id} />
              <Area name="body" label="Internal note (staff only)" />
            </ActionForm>
          </div>
        </div>
      </div>
    </>
  );
}
