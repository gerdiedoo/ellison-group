import { SourceLabel } from "@/components/admin/ui";
import { isRecordId } from "@/lib/validation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Field, Area, Assignment, Check } from "@/lib/admin-fields";
import {
  updateLeadContact,
  addNote,
  addTask,
  updateTask,
  addInterest,
  removeInterest,
  deleteNote,
  updateNote,
  deleteTask,
} from "@/app/actions/crm";
import { RecordsDeleteLead } from "@/components/admin/records-delete-lead";
import { RecordsLeadPipeline } from "@/components/admin/records-lead-pipeline";
import { RecordsTaskToggle } from "@/components/admin/records-task-toggle";
import { RecordsInquiryStatus } from "@/components/admin/records-inquiry-status";
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
const time = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { db } = await requireStaff(),
    { id } = await params;
  if (!isRecordId(id)) notFound();
  const [lr, team, notes, tasks, inquiries, interests, conversations] =
    await Promise.all([
      db.from("leads").select("*").eq("id", id).maybeSingle(),
      db.from("profiles").select("*").in("role", ["agent", "admin"]),
      db
        .from("notes")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      db
        .from("tasks")
        .select("*")
        .eq("lead_id", id)
        .order("done")
        .order("due_at"),
      db
        .from("inquiries")
        .select("*,property:properties(id,address)")
        .eq("lead_id", id)
        .order("created_at", { ascending: false }),
      db
        .from("lead_properties")
        .select("property_id,property:properties(id,address)")
        .eq("lead_id", id),
      db
        .from("conversations")
        .select("*")
        .eq("lead_id", id)
        .order("updated_at", { ascending: false }),
    ]);
  if (
    [lr, team, notes, tasks, inquiries, interests, conversations].some(
      (r) => r.error,
    )
  )
    throw new Error("Unable to load lead");
  const lead = lr.data;
  if (!lead) notFound();
  const [allProperties, activity] = await Promise.all([
    db.from("properties").select("id,address").order("address"),
    db
      .from("activity_logs")
      .select("*")
      .in("entity_id", [
        id,
        ...(notes.data || []).map((n) => n.id),
        ...(tasks.data || []).map((t) => t.id),
        ...(inquiries.data || []).map((i) => i.id),
        ...(conversations.data || []).map((c) => c.id),
      ])
      .order("created_at", { ascending: false })
      .limit(25),
  ]);
  if (allProperties.error || activity.error)
    throw new Error("Unable to load lead history");
  const properties = (interests.data || []).flatMap((i) =>
    i.property ? [i.property] : [],
  );
  const latestContext = inquiries.data?.find(
    (i) =>
      i.context &&
      typeof i.context === "object" &&
      !Array.isArray(i.context) &&
      i.context.contact_method,
  )?.context;
  const contactMethod =
    latestContext &&
    typeof latestContext === "object" &&
    !Array.isArray(latestContext) &&
    typeof latestContext.contact_method === "string"
      ? latestContext.contact_method
      : "Not specified";
  const initials = lead.full_name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <>
      <div className="crumb">
        <Link href="/admin/leads">← Leads</Link>
      </div>
      <div className="ph">
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span className="av" style={{ width: 52, height: 52, fontSize: 18 }}>
            {initials}
          </span>
          <div>
            <h1>{lead.full_name}</h1>
            <p>
              <SourceLabel source={lead.source} /> · captured{" "}
              {time(lead.created_at)}
            </p>
          </div>
        </div>
        <RecordsDeleteLead id={id} name={lead.full_name} />
      </div>
      <div className="dg">
        <div className="stack">
          <section className="card">
            <h2>Contact information</h2>
            <p className="sub">Contact details shared with the team.</p>
            <ActionForm
              action={updateLeadContact}
              label="Save changes"
              className="record-contact-form"
            >
              <input type="hidden" name="id" value={id} />
              <Field
                name="full_name"
                label="Full name"
                value={lead.full_name}
                required
              />
              <Field
                name="email"
                label="Email"
                type="email"
                value={lead.email}
                required
              />
              <Field name="phone" label="Phone" type="tel" value={lead.phone} />
              <label className="f">
                Preferred contact
                <select
                  aria-label="Preferred contact"
                  value={contactMethod}
                  disabled
                >
                  <option>{contactMethod}</option>
                </select>
              </label>
              <label className="f">
                Lead score (0–100)
                <input
                  aria-label="Lead score"
                  value="—"
                  disabled
                  title="No verified score recorded"
                />
              </label>
            </ActionForm>
          </section>
          <section className="card">
            <h2>Pipeline</h2>
            <RecordsLeadPipeline
              id={id}
              status={lead.status}
              assigned={lead.assigned_to}
              team={team.data || []}
            />
            <div className="m" style={{ color: "var(--muted)", fontSize: 13 }}>
              Source: {lead.source}
              <br />
              Capture method:{" "}
              {lead.source === "manual"
                ? "Added by staff"
                : lead.source === "chatbot"
                  ? "Chatbot contact form"
                  : "Contact form"}
              <br />
              Consent recorded: {date(lead.consent_at)}
              <br />
              Last activity {time(lead.updated_at)}
            </div>
            <details style={{ marginTop: 10 }}>
              <summary
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                View recorded consent
              </summary>
              <p style={{ fontSize: 12, marginTop: 6 }}>{lead.consent_text}</p>
            </details>
          </section>
          <section className="card">
            <h2>Interested properties</h2>
            <div className="chips" style={{ margin: "10px 0" }}>
              {properties.length ? (
                properties.map((p) => (
                  <Link
                    className="chip"
                    key={p.id}
                    href={"/admin/properties?selected=" + p.id}
                  >
                    {p.address}
                  </Link>
                ))
              ) : (
                <span style={{ color: "var(--muted)" }}>None yet</span>
              )}
            </div>
            <ActionForm action={addInterest} label="Add" className="pill-row">
              <input type="hidden" name="lead_id" value={id} />
              <select
                name="property_id"
                aria-label="Property"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Add a property…
                </option>
                {allProperties.data
                  ?.filter((p) => !properties.some((i) => i.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address}
                    </option>
                  ))}
              </select>
            </ActionForm>
            {!!properties.length && (
              <details style={{ marginTop: 10 }}>
                <summary
                  style={{
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--muted)",
                  }}
                >
                  Manage interested properties
                </summary>
                {properties.map((p) => (
                  <div key={p.id} className="li">
                    <div className="b">{p.address}</div>
                    <ActionForm
                      action={removeInterest}
                      label="Remove interest"
                      className="pill-row"
                    >
                      <input type="hidden" name="lead_id" value={id} />
                      <input type="hidden" name="property_id" value={p.id} />
                    </ActionForm>
                  </div>
                ))}
              </details>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="card">
            <h2>Internal notes</h2>
            <p className="sub">Visible to the team only.</p>
            <ActionForm
              action={addNote}
              label="Add note"
              className="record-note-form"
            >
              <input type="hidden" name="lead_id" value={id} />
              <textarea
                name="body"
                aria-label="New internal note"
                placeholder="Add a note about this lead"
                rows={2}
                required
              />
            </ActionForm>
            {notes.data?.length ? (
              notes.data.map((n) => (
                <div className="note" key={n.id}>
                  <div style={{ whiteSpace: "pre-wrap" }}>{n.body}</div>
                  <div className="m">
                    {team.data?.find((t) => t.id === n.author_id)?.full_name ||
                      "Team"}{" "}
                    · {time(n.created_at)}
                  </div>
                  <details style={{ marginTop: 6 }}>
                    <summary
                      style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Manage note
                    </summary>
                    <ActionForm action={updateNote} label="Save note">
                      <input type="hidden" name="id" value={n.id} />
                      <Area
                        name="body"
                        label="Edit note"
                        value={n.body}
                        rows={2}
                      />
                    </ActionForm>
                    <ActionForm action={deleteNote} label="Delete note">
                      <input type="hidden" name="id" value={n.id} />
                    </ActionForm>
                  </details>
                </div>
              ))
            ) : (
              <div className="m" style={{ color: "var(--muted)" }}>
                No notes yet.
              </div>
            )}
          </section>
          <section className="card">
            <h2>Follow-up reminders</h2>
            <ActionForm
              action={addTask}
              label="Add reminder"
              className="record-reminder-form"
            >
              <input type="hidden" name="lead_id" value={id} />
              <input
                name="title"
                aria-label="Task"
                placeholder="What needs to happen?"
                required
                style={{ flex: 1, minWidth: 180 }}
              />
              <input
                name="due_at"
                aria-label="Due date (Central time)"
                type="date"
                required
              />
              <details className="record-reminder-assignment">
                <summary
                  style={{
                    fontSize: 12,
                    cursor: "pointer",
                    color: "var(--muted)",
                  }}
                >
                  Assign reminder
                </summary>
                <Assignment team={team.data || []} />
              </details>
            </ActionForm>
            {tasks.data?.length ? (
              tasks.data.map((t) => (
                <div key={t.id}>
                  <RecordsTaskToggle task={t} />
                  <details>
                    <summary
                      style={{
                        color: "var(--muted)",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Edit reminder
                    </summary>
                    <ActionForm action={updateTask} label="Update task">
                      <input type="hidden" name="id" value={t.id} />
                      <Field
                        name="title"
                        label="Task title"
                        value={t.title}
                        required
                      />
                      <Field
                        name="due_at"
                        label="Due date"
                        type="date"
                        value={t.due_at.slice(0, 10)}
                        required
                      />
                      <Assignment
                        team={team.data || []}
                        value={t.assigned_to}
                      />
                      <Check name="done" label="Completed" checked={t.done} />
                    </ActionForm>
                    <ActionForm action={deleteTask} label="Delete task">
                      <input type="hidden" name="id" value={t.id} />
                    </ActionForm>
                  </details>
                </div>
              ))
            ) : (
              <div className="m" style={{ color: "var(--muted)" }}>
                No reminders.
              </div>
            )}
          </section>
          <section className="card">
            <h2>Property inquiry history</h2>
            {inquiries.data?.length ? (
              <div className="tw mini" style={{ marginTop: 10 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Property</th>
                      <th>Preferred time</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.data.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <Link
                            href={"/admin/inquiries/" + i.id}
                            aria-label={i.kind + " · " + i.status}
                          >
                            {i.kind}
                          </Link>
                          <div className="em">{i.message.slice(0, 90)}</div>
                        </td>
                        <td>
                          {i.property ? (
                            <Link
                              className="chip"
                              href={
                                "/admin/properties?selected=" + i.property.id
                              }
                            >
                              {i.property.address}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{i.preferred_date || "—"}</td>
                        <td>
                          <RecordsInquiryStatus
                            id={i.id}
                            status={i.status}
                            assigned={i.assigned_to}
                          />
                        </td>
                        <td>{date(i.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty">
                <b>No inquiries yet</b>
              </div>
            )}
          </section>
          <section className="card">
            <h2>Chatbot conversations</h2>
            {conversations.data?.length ? (
              conversations.data.map((c) => (
                <Link
                  className="li"
                  key={c.id}
                  href={"/admin/conversations/" + c.id}
                >
                  <div className="b">
                    <div className="t">
                      <span
                        className={
                          "badge c-" +
                          (c.status === "human"
                            ? "Handed"
                            : c.status === "resolved"
                              ? "Closed"
                              : "Active")
                        }
                      >
                        {c.status === "human"
                          ? "Handed to agent"
                          : c.status === "resolved"
                            ? "Closed"
                            : "Active"}
                      </span>{" "}
                      <span className="m">
                        Last activity {time(c.updated_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div
                className="m"
                style={{ color: "var(--muted)", marginTop: 8 }}
              >
                No chatbot conversations linked to this lead.
              </div>
            )}
          </section>
          <section className="card">
            <h2>Activity timeline</h2>
            <div className="tl" style={{ marginTop: 14 }}>
              {activity.data?.length ? (
                activity.data.map((a) => (
                  <div className="e" key={a.id}>
                    <div>
                      {a.action.charAt(0) + a.action.slice(1).toLowerCase()} ·{" "}
                      {a.entity_type.replaceAll("_", " ")}
                    </div>
                    <div className="m">{time(a.created_at)}</div>
                  </div>
                ))
              ) : (
                <div className="m">No activity.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
