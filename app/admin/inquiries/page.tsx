import { PageHeading } from "@/components/admin/ui";
import { queryValues } from "@/lib/validation";
import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { InquiryRecord } from "@/components/inquiry-record";
import { inquiryStatuses, inquiryKinds } from "@/lib/validation";
export default async function Inquiries({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kind?: string; page?: string }>;
}) {
  const p = queryValues(await searchParams);
  const { db } = await requireStaff();
  let q = db
    .from("inquiries")
    .select("*,lead:leads(full_name),property:properties(address)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status);
  if (p.kind) q = q.eq("kind", p.kind);
  const page = pageNumber(p.page);
  const [{ data: inquiries, count, error }, { data: team, error: teamError }] =
    await Promise.all([
      q.range((page - 1) * 30, page * 30 - 1),
      db.from("profiles").select("*").in("role", ["agent", "admin"]),
    ]);
  if (error || teamError) throw new Error("Unable to load inquiries");
  const url = (n: number) =>
    "/admin/inquiries?" + new URLSearchParams({ ...p, page: String(n) });
  return (
    <>
      <PageHeading
        title="Inquiries"
        description="Review and assign website requests."
      />
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
          <InquiryRecord key={i.id} inquiry={i} team={team || []} />
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
