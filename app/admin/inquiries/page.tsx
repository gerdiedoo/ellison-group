import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { ActionForm } from "@/components/action-form";
import { Select, Assignment } from "@/lib/admin-fields";
import { updateInquiry } from "@/app/actions/crm";
import { inquiryStatuses, inquiryKinds } from "@/lib/validation";
export default async function Inquiries({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; page?: string }>;
}) {
  const p = await searchParams;
  const { db } = await requireStaff();
  let q = db
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status);
  if (p.kind) q = q.eq("kind", p.kind);
  const page = pageNumber(p.page);
  const [
    { data: inquiries, count, error },
    { data: team },
    { data: leads },
    { data: properties },
  ] = await Promise.all([
    q.range((page - 1) * 30, page * 30 - 1),
    db.from("profiles").select("*").in("role", ["agent", "admin"]),
    db.from("leads").select("id,full_name").limit(10000),
    db.from("properties").select("id,address").limit(10000),
  ]);
  if (error) throw new Error("Unable to load inquiries");
  const url = (n: number) =>
    "/admin/inquiries?" + new URLSearchParams({ ...p, page: String(n) });
  return (
    <>
      <h1>Inquiries</h1>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select name="status" id="status" defaultValue={p.status}>
            <option value="">All statuses</option>
            {inquiryStatuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="kind">Type</label>
          <select name="kind" id="kind" defaultValue={p.kind}>
            <option value="">All types</option>
            {inquiryKinds.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <button className="btn">Filter</button>
      </form>
      <p>{count} inquiries</p>
      <div className="stack">
        {inquiries?.map((i) => (
          <article className="card" id={i.id} key={i.id}>
            <div className="two-cols">
              <div>
                <span className="eyebrow">{i.kind}</span>
                <h2>
                  <Link href={"/admin/leads/" + i.lead_id}>
                    {leads?.find((l) => l.id === i.lead_id)?.full_name ||
                      "View lead"}
                  </Link>
                </h2>
                {i.property_id && (
                  <p>
                    <Link
                      className="link"
                      href={"/admin/properties/" + i.property_id}
                    >
                      {properties?.find((p) => p.id === i.property_id)
                        ?.address || "View property"}
                    </Link>
                  </p>
                )}
                <p style={{ whiteSpace: "pre-wrap" }}>
                  {i.message || "No message provided."}
                </p>
                <p>Submitted {i.created_at}</p>
                {i.preferred_date && (
                  <p>Preferred date: {i.preferred_date} (unconfirmed)</p>
                )}
                {i.context && (
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
                    {JSON.stringify(i.context, null, 2)}
                  </pre>
                )}
              </div>
              <ActionForm action={updateInquiry}>
                <input type="hidden" name="id" value={i.id} />
                <Select
                  name="status"
                  label="Status"
                  options={inquiryStatuses}
                  value={i.status}
                />
                <Assignment team={team || []} value={i.assigned_to} />
              </ActionForm>
            </div>
          </article>
        ))}
      </div>
      {!inquiries?.length && (
        <p className="empty">No inquiries match the current filters.</p>
      )}
      <div className="toolbar">
        {page > 1 && (
          <Link className="btn" href={url(page - 1)}>
            Previous
          </Link>
        )}
        {page * 30 < (count || 0) && (
          <Link className="btn" href={url(page + 1)}>
            Next
          </Link>
        )}
      </div>
    </>
  );
}
