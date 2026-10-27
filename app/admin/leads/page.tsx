import { SourceLabel } from "@/components/admin/ui";
import { RecordsFilterForm } from "@/components/admin/records-filter-form";
import { queryValues, pageNumber } from "@/lib/validation";
import { leadQuery, type LeadFilters } from "@/lib/crm-data";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { leadStatuses } from "@/lib/validation";
import { RecordsLinkRow } from "@/components/admin/records-link-row";
import { RecordsDeleteLead } from "@/components/admin/records-delete-lead";
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  });
function statusClass(status: string) {
  return "badge s-" + status.split(" ")[0];
}
export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<LeadFilters>;
}) {
  const p = queryValues(await searchParams),
    { db } = await requireStaff();
  const [team, result, total] = await Promise.all([
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
    leadQuery(db, p).range(
      (pageNumber(p.page) - 1) * 50,
      pageNumber(p.page) * 50 - 1,
    ),
    db.from("leads").select("id", { count: "exact" }).limit(1),
  ]);
  if (team.error || result.error || total.error)
    throw new Error("Unable to load leads");
  const leads = result.data || [],
    ids = leads.map((l) => l.id),
    page = pageNumber(p.page);
  const [interest, inquiries] = await Promise.all([
    ids.length
      ? db
          .from("lead_properties")
          .select("lead_id,property:properties(id,address)")
          .in("lead_id", ids)
      : Promise.resolve({ data: [], error: null }),
    ids.length
      ? db
          .from("inquiries")
          .select("lead_id,kind,created_at")
          .in("lead_id", ids)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (interest.error || inquiries.error)
    throw new Error("Unable to load lead context");
  const url = (values: Record<string, string>) =>
    "/admin/leads?" + new URLSearchParams({ ...p, ...values });
  const sort = (field: string) =>
    url({
      sort: field,
      dir: p.sort === field && p.dir !== "desc" ? "desc" : "asc",
      page: "1",
    });
  const cols = [
    { field: "full_name", label: "Lead" },
    { field: "email", label: "Email" },
    { field: "phone", label: "Phone" },
    { field: "source", label: "Source" },
    { label: "Interested property" },
    { label: "Inquiry type" },
    { field: "status", label: "Status" },
    { label: "Score" },
    { field: "assigned_to", label: "Assigned agent" },
    { field: "updated_at", label: "Last activity" },
    { field: "created_at", label: "Created" },
  ];
  return (
    <>
      <div className="ph">
        <div>
          <h1>Leads</h1>
          <p>
            Everyone who has shared contact details, from properties, forms and
            the chatbot.
          </p>
        </div>
        <div className="pill-row">
          <Link className="btn ghost" href="/admin/leads/new">
            <Plus size={16} />
            Create lead
          </Link>
          <a
            className="btn"
            href={"/admin/leads/export?" + new URLSearchParams(p)}
          >
            <Download size={16} />
            Export CSV
          </a>
        </div>
      </div>
      <RecordsFilterForm>
        <input
          type="search"
          name="q"
          placeholder="Search name, email or phone"
          aria-label="Search leads"
          defaultValue={p.q}
        />
        <select name="status" aria-label="Status" defaultValue={p.status}>
          <option value="">All statuses</option>
          {leadStatuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="source" aria-label="Source" defaultValue={p.source}>
          <option value="">All sources</option>
          {["form", "chatbot", "manual", "google"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select name="agent" aria-label="Agent" defaultValue={p.agent}>
          <option value="">All agents</option>
          <option value="unassigned">Unassigned</option>
          {team.data
            ?.filter((t) => t.active)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
        </select>
        <select
          name="range"
          aria-label="Date created"
          defaultValue={p.range || "all"}
        >
          <option value="all">Any date</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        {p.sort && <input type="hidden" name="sort" value={p.sort} />}
        {p.dir && <input type="hidden" name="dir" value={p.dir} />}
        <Link className="btn ghost sm" href="/admin/leads">
          Clear
        </Link>
        <span className="cnt" aria-live="polite">
          {result.count || 0} of {total.count || 0} leads
        </span>
      </RecordsFilterForm>
      <div className="tw rc">
        <table>
          <thead>
            <tr>
              {cols.map((col) => (
                <th
                  key={col.label}
                  scope="col"
                  aria-sort={
                    col.field && p.sort === col.field
                      ? p.dir === "desc"
                        ? "descending"
                        : "ascending"
                      : "none"
                  }
                >
                  {col.field ? (
                    <Link href={sort(col.field)}>
                      {col.label}
                      {p.sort === col.field
                        ? p.dir === "desc"
                          ? " ↓"
                          : " ↑"
                        : ""}
                    </Link>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length ? (
              leads.map((l) => {
                const properties =
                  interest.data
                    ?.filter((i) => i.lead_id === l.id)
                    .flatMap((i) => (i.property ? [i.property] : [])) || [];
                const latest = inquiries.data?.find((i) => i.lead_id === l.id);
                return (
                  <RecordsLinkRow
                    key={l.id}
                    href={"/admin/leads/" + l.id}
                    label={"Open " + l.full_name}
                  >
                    <td className="first" data-l="Lead">
                      <div className="nm">
                        <Link href={"/admin/leads/" + l.id}>{l.full_name}</Link>
                      </div>
                    </td>
                    <td data-l="Email">{l.email}</td>
                    <td data-l="Phone">{l.phone || "—"}</td>
                    <td data-l="Source">
                      <SourceLabel source={l.source} />
                    </td>
                    <td data-l="Property">
                      {properties.length ? (
                        <>
                          {properties[0].address}
                          {properties.length > 1 && (
                            <span className="em">
                              {" "}
                              +{properties.length - 1}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="em">None yet</span>
                      )}
                    </td>
                    <td data-l="Inquiry">{latest?.kind || "—"}</td>
                    <td data-l="Status">
                      <span className={statusClass(l.status)}>{l.status}</span>
                    </td>
                    <td data-l="Score">
                      <span title="No verified score recorded">—</span>
                    </td>
                    <td data-l="Agent">
                      {team.data?.find((t) => t.id === l.assigned_to)
                        ?.full_name || "Unassigned"}
                    </td>
                    <td data-l="Last activity">{date(l.updated_at)}</td>
                    <td data-l="Created">{date(l.created_at)}</td>
                    <td data-l="Actions">
                      <span className="pill-row">
                        <Link
                          className="btn sm ghost"
                          href={"/admin/leads/" + l.id}
                        >
                          View
                        </Link>
                        <RecordsDeleteLead
                          compact
                          id={l.id}
                          name={l.full_name}
                        />
                      </span>
                    </td>
                  </RecordsLinkRow>
                );
              })
            ) : (
              <tr>
                <td colSpan={12}>
                  <div className="empty">
                    <b>No leads match these filters</b>Clear a filter or search
                    for something else.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(page > 1 || page * 50 < (result.count || 0)) && (
        <div className="toolbar" style={{ marginTop: 14 }}>
          {page > 1 && (
            <Link
              className="btn ghost sm"
              href={url({ page: String(page - 1) })}
            >
              Previous
            </Link>
          )}
          {page * 50 < (result.count || 0) && (
            <Link
              className="btn ghost sm"
              href={url({ page: String(page + 1) })}
            >
              Next
            </Link>
          )}
        </div>
      )}
    </>
  );
}
