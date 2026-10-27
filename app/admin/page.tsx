import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { queryValues } from "@/lib/validation";
import {
  overviewMetrics,
  overviewTimestamp,
  overviewChart,
  type OverviewMetrics,
} from "@/lib/overview";
import {
  PageHeading,
  EmptyState,
  StatusBadge,
  SourceLabel,
  shortDate,
  sourceColors,
} from "@/components/admin/ui";
import {
  OverviewRange,
  FollowupCheck,
} from "@/components/admin/overview-controls";
import { LeadChart } from "@/components/admin/lead-chart";
import { activityDescription, relativeTime } from "@/lib/admin-display";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const p = queryValues(await searchParams);
  const range = ["7", "30", "90", "all"].includes(p.range) ? p.range : "30";
  const { db } = await requireStaff();
  const now = overviewTimestamp();
  const days = range === "all" ? null : Number(range);
  const start = days
    ? new Date(now - days * 86400000).toISOString()
    : undefined;
  let leadsQuery = db
    .from("leads")
    .select(
      "id,full_name,source,status,created_at,interests:lead_properties(property:properties(address))",
    )
    .order("created_at", { ascending: false })
    .limit(6);
  let inquiriesQuery = db
    .from("inquiries")
    .select(
      "id,kind,created_at,lead:leads(id,full_name),property:properties(address)",
    )
    .order("created_at", { ascending: false })
    .limit(5);
  let conversationsQuery = db
    .from("conversations")
    .select("id,status,updated_at,lead:leads(full_name),messages(body,created_at)")
    .order("updated_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" })
    .limit(5);
  let activityQuery = db
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  if (start) {
    leadsQuery = leadsQuery.gte("created_at", start);
    inquiriesQuery = inquiriesQuery.gte("created_at", start);
    conversationsQuery = conversationsQuery.gte("updated_at", start);
    activityQuery = activityQuery.gte("created_at", start);
  }
  const chartDays = days || 63;
  const chartStart = now - chartDays * 86400000;
  const [
    metrics,
    prior,
    chart,
    leads,
    tasks,
    inquiries,
    conversations,
    activity,
  ] = await Promise.all([
    overviewMetrics(db, start, new Date(now).toISOString()),
    days
      ? overviewMetrics(
          db,
          new Date(now - days * 2 * 86400000).toISOString(),
          start,
        )
      : Promise.resolve(null),
    overviewChart(
      db,
      new Date(chartStart).toISOString(),
      new Date(now).toISOString(),
    ),
    leadsQuery,
    db
      .from("tasks")
      .select("*,lead:leads(full_name)")
      .eq("done", false)
      .order("due_at")
      .limit(6),
    inquiriesQuery,
    conversationsQuery,
    activityQuery,
  ]);
  if ([leads, tasks, inquiries, conversations, activity].some((r) => r.error))
    throw new Error("Unable to load overview records");
  const period = days ? `last ${days} days` : "all time";
  const kpis: { label: string; key: keyof OverviewMetrics; note?: string }[] = [
    { label: "Total leads", key: "total" },
    { label: "New leads", key: "new", note: "Not yet contacted" },
    {
      label: "Qualified leads",
      key: "qualified",
      note: "Qualified or scheduled",
    },
    { label: "Leads contacted", key: "contacted" },
    { label: "Property inquiries", key: "inquiries" },
    { label: "Google leads", key: "google" },
    { label: "Form submissions", key: "form" },
    { label: "Chatbot-generated leads", key: "chatbot" },
  ];
  const other = Math.max(
    0,
    metrics.total - metrics.google - metrics.form - metrics.chatbot,
  );
  const sources = [
    { key: "google", count: metrics.google },
    { key: "form", count: metrics.form },
    { key: "chatbot", count: metrics.chatbot },
    ...(other ? [{ key: "Other", count: other }] : []),
  ];
  return (
    <>
      <PageHeading
        title="Overview"
        description={`Lead capture and AI assistant activity, ${period}.`}
      >
        <OverviewRange value={range} />
      </PageHeading>
      <div className="proto-note">
        <b>Live CRM data.</b> Metrics reflect saved records in the selected date
        range.
      </div>
      <div className="grid g4">
        {kpis.map((k) => {
          const n = metrics[k.key],
            previous = prior?.[k.key];
          return (
            <div className="card kpi" id={"kpi-" + k.key} key={k.key}>
              <div className="l">{k.label}</div>
              <div className="v">{n}</div>
              <div className="d">
                {k.note && <>{k.note} · </>}
                {previous === undefined ? (
                  "All stored records"
                ) : previous === 0 ? (
                  n ? (
                    <>
                      <b className="up">+{n}</b> vs prior period
                    </>
                  ) : (
                    "No change vs prior"
                  )
                ) : (
                  <>
                    <b className={n >= previous ? "up" : "dn"}>
                      {n >= previous ? "▲" : "▼"}{" "}
                      {Math.abs(Math.round(((n - previous) / previous) * 100))}%
                    </b>{" "}
                    vs prior {days}d
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-h">
            <h2>Leads over time</h2>
            <div className="legend">
              {[
                "google",
                "form",
                "chatbot",
                ...(chart.some(
                  (row) => !["google", "form", "chatbot"].includes(row.source),
                )
                  ? ["manual"]
                  : []),
              ].map((s) => (
                <span key={s}>
                  <i style={{ background: sourceColors[s] }} />
                  {s === "manual" ? "Other" : s[0].toUpperCase() + s.slice(1)}
                </span>
              ))}
            </div>
          </div>
          <LeadChart
            rows={chart}
            start={chartStart}
            end={now}
            buckets={
              range === "7" ? 7 : range === "30" ? 30 : range === "90" ? 13 : 9
            }
          />
          {!days && (
            <p className="sub">
              Chart shows the last nine weeks. Totals above cover all time.
            </p>
          )}
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Lead sources</h2>
          </div>
          <p className="sub">
            {metrics.total} leads, {period}
          </p>
          {sources.map((s) => (
            <div className="bar" key={s.key}>
              <SourceLabel source={s.key} />
              <span className="tr">
                <b
                  style={{
                    width: `${(s.count / (metrics.total || 1)) * 100}%`,
                    background: sourceColors[s.key] || "#6a746d",
                  }}
                />
              </span>
              <span style={{ textAlign: "right" }}>
                {s.count} · {Math.round((s.count / (metrics.total || 1)) * 100)}
                %
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-h">
            <h2>Recent leads</h2>
            <Link href="/admin/leads">View all</Link>
          </div>
          {leads.data?.length ? (
            <div className="mini tw">
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Source</th>
                    <th>Property</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.data.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link className="nm" href={"/admin/leads/" + l.id}>
                          {l.full_name}
                        </Link>
                      </td>
                      <td>
                        <SourceLabel source={l.source} />
                      </td>
                      <td>
                        {l.interests[0]?.property?.address || (
                          <span className="em">None yet</span>
                        )}
                      </td>
                      <td>
                        <StatusBadge status={l.status} />
                      </td>
                      <td title={shortDate(l.created_at)}>
                        {relativeTime(l.created_at, now)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No leads in this period"
              description="Try a wider date range."
            />
          )}
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Follow-up reminders</h2>
          </div>
          {tasks.data?.length ? (
            tasks.data.map((t) => (
              <div className="li" key={t.id}>
                <FollowupCheck id={t.id} title={t.title} />
                <div className="b">
                  <div className="t">{t.title}</div>
                  <div className="m">
                    <Link href={"/admin/leads/" + t.lead_id}>
                      {t.lead?.full_name || "Open lead"}
                    </Link>{" "}
                    ·{" "}
                    <span
                      className={
                        Date.parse(t.due_at) < now ? "over" : undefined
                      }
                    >
                      {Date.parse(t.due_at) < now ? "Overdue · " : "Due "}
                      {shortDate(t.due_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="All caught up"
              description="No open reminders."
            />
          )}
        </div>
      </div>
      <div className="grid g3">
        <div className="card">
          <div className="card-h">
            <h2>Property inquiries</h2>
            <Link href="/admin/inquiries">View all</Link>
          </div>
          {inquiries.data?.length ? (
            inquiries.data.map((i) => (
              <Link className="li" href={"/admin/inquiries/" + i.id} key={i.id}>
                <div className="b">
                  <div className="t">{i.kind}</div>
                  <div className="m">
                    {i.lead?.full_name} · {i.property?.address || "No property"}
                  </div>
                </div>
                <span className="m" title={shortDate(i.created_at)}>
                  {relativeTime(i.created_at, now)}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title="No inquiries" />
          )}
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Chatbot conversations</h2>
            <Link href="/admin/conversations">Open inbox</Link>
          </div>
          {conversations.data?.length ? (
            conversations.data.map((c) => (
              <Link
                className="li"
                href={"/admin/conversations/" + c.id}
                key={c.id}
              >
                <div className="b">
                  <div className="t">
                    {c.lead?.full_name || "Anonymous visitor"}{" "}
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="pv">{c.messages[0]?.body || ""}</div>
                </div>
                <span className="m" title={shortDate(c.updated_at)}>
                  {relativeTime(c.updated_at, now)}
                </span>
              </Link>
            ))
          ) : (
            <EmptyState title="No conversations" />
          )}
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Latest activity</h2>
            <Link href="/admin/activity">Full log</Link>
          </div>
          {activity.data?.length ? (
            activity.data.map((a) => (
              <div className="li" key={a.id}>
                <div className="b">
                  <div className="t" style={{ fontWeight: 400 }}>
                    {activityDescription(a.action, a.entity_type)}
                  </div>
                  <div className="m" title={shortDate(a.created_at)}>
                    {relativeTime(a.created_at, now)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No activity" />
          )}
        </div>
      </div>
    </>
  );
}
