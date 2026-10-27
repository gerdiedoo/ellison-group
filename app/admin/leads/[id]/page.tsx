import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, Area, Select, Assignment, Check } from "@/lib/admin-fields";
import {
  updateLead,
  addNote,
  addTask,
  updateTask,
  deleteLead,
  addInterest,
  removeInterest,
  deleteNote,
  deleteTask,
} from "@/app/actions/crm";
import { leadStatuses } from "@/lib/validation";
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { db } = await requireStaff();
  const [lr, team, notes, tasks, inquiries, interests, activity] =
    await Promise.all([
      db.from("leads").select("*").eq("id", id).maybeSingle(),
      db.from("profiles").select("*").in("role", ["agent", "admin"]),
      db
        .from("notes")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      db.from("tasks").select("*").eq("lead_id", id).order("due_at"),
      db
        .from("inquiries")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      db.from("lead_properties").select("property_id").eq("lead_id", id),
      db
        .from("activity_logs")
        .select("*")
        .eq("entity_type", "leads")
        .eq("entity_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
  if (
    [lr, team, notes, tasks, inquiries, interests, activity].some(
      (r) => r.error,
    )
  )
    throw new Error("Unable to load lead");
  const l = lr.data;
  if (!l) notFound();
  const { data: properties } = interests.data?.length
    ? await db
        .from("properties")
        .select("id,address")
        .in(
          "id",
          interests.data.map((i) => i.property_id),
        )
    : { data: [] };
  const { data: allProperties } = await db
    .from("properties")
    .select("id,address")
    .order("address");
  return (
    <>
      <Link className="link" href="/admin/leads">
        ← Leads
      </Link>
      <h1>{l.full_name}</h1>
      <p>
        {l.email} · Created {new Date(l.created_at).toLocaleDateString("en-US")}
      </p>
      <div className="two-cols">
        <section className="card" style={{ padding: 24 }}>
          <h2>Lead details</h2>
          <ActionForm action={updateLead}>
            <input type="hidden" name="id" value={id} />
            <Field
              name="full_name"
              label="Full name"
              value={l.full_name}
              required
            />
            <Field
              name="email"
              label="Email"
              type="email"
              value={l.email}
              required
            />
            <Field name="phone" label="Phone" value={l.phone} />
            <Select
              name="status"
              label="Status"
              options={leadStatuses}
              value={l.status}
            />
            <Assignment team={team.data || []} value={l.assigned_to} />
          </ActionForm>
          <h2>Consent</h2>
          <p className="policy">
            {l.consent_text}
            <br />
            {l.consent_at}
          </p>
          <h2>Interested properties</h2>
          {properties?.map((p) => (
            <div key={p.id}>
              <Link className="link" href={"/admin/properties/" + p.id}>
                {p.address}
              </Link>
              <ActionForm action={removeInterest} label="Remove interest">
                <input type="hidden" name="lead_id" value={id} />
                <input type="hidden" name="property_id" value={p.id} />
              </ActionForm>
            </div>
          ))}
          <ActionForm action={addInterest} label="Add interested property">
            <input type="hidden" name="lead_id" value={id} />
            <div className="field">
              <label>
                Property
                <select aria-label="Property" name="property_id" required>
                  {allProperties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </ActionForm>
        </section>
        <section className="card" style={{ padding: 24 }}>
          <h2>Internal notes</h2>
          {notes.data?.map((n) => (
            <div className="notice" key={n.id}>
              <p style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
              <small>
                {team.data?.find((t) => t.id === n.author_id)?.full_name ||
                  "Team"}{" "}
                ·{" "}
                {new Date(n.created_at).toLocaleString("en-US", {
                  timeZone: "America/Chicago",
                })}
              </small>
              <ActionForm action={deleteNote} label="Delete note">
                <input type="hidden" name="id" value={n.id} />
              </ActionForm>
            </div>
          ))}
          <ActionForm action={addNote} label="Add note">
            <input type="hidden" name="lead_id" value={id} />
            <Area name="body" label="New internal note" />
          </ActionForm>
        </section>
      </div>
      <h2>Follow-up tasks</h2>
      <div className="grid">
        {tasks.data?.map((t) => (
          <div className="card" key={t.id}>
            <p>{t.title}</p>
            <p>
              Due {t.due_at.slice(0, 10)} ·{" "}
              {team.data?.find((p) => p.id === t.assigned_to)?.full_name ||
                "Unassigned"}
            </p>
            <ActionForm action={updateTask} label="Update task">
              <input type="hidden" name="id" value={t.id} />
              <Field name="title" label="Task title" value={t.title} required />
              <Field
                name="due_at"
                label="Due date"
                type="date"
                value={t.due_at.slice(0, 10)}
                required
              />
              <Assignment team={team.data || []} value={t.assigned_to} />
              <Check name="done" label="Completed" checked={t.done} />
            </ActionForm>
            <ActionForm action={deleteTask} label="Delete task">
              <input type="hidden" name="id" value={t.id} />
            </ActionForm>
          </div>
        ))}
        <div className="card">
          <ActionForm action={addTask} label="Add follow-up">
            <input type="hidden" name="lead_id" value={id} />
            <Field name="title" label="Task" required />
            <Field
              name="due_at"
              type="date"
              label="Due date (Central time)"
              required
            />
            <Assignment team={team.data || []} />
          </ActionForm>
        </div>
      </div>
      <h2>Inquiry history</h2>
      {inquiries.data?.map((i) => (
        <div className="notice" key={i.id}>
          <Link className="link" href={"/admin/inquiries#" + i.id}>
            {i.kind} · {i.status}
          </Link>
          <p>{i.message}</p>
          <small>{i.created_at}</small>
        </div>
      ))}
      {
        <div className="card">
          <h2>Delete lead</h2>
          <p>
            Deletes this lead, their inquiries, notes and tasks. Audit records
            remain. Conversations are retained without the lead association.
          </p>
          <ActionForm action={deleteLead} label="Delete lead">
            <input type="hidden" name="id" value={id} />
            <Check name="confirm" label="Confirm permanent lead deletion" />
          </ActionForm>
        </div>
      }
      <h2>Lead activity</h2>
      {activity.data?.map((a) => (
        <p key={a.id}>
          {a.action} · {a.created_at} · {JSON.stringify(a.details)}
        </p>
      ))}
    </>
  );
}
