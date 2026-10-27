import { queryValues } from "@/lib/validation";
import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/data";
export default async function Properties({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; visibility?: string; page?: string }>;
}) {
  const p = queryValues(await searchParams);
  const { db } = await requireStaff();
  let query = db
    .from("properties")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  if (p.q)
    query = query.ilike(
      "address",
      "%" + p.q.replace(/[%_]/g, "").slice(0, 100) + "%",
    );
  if (p.visibility) query = query.eq("published", p.visibility === "published");
  const page = pageNumber(p.page);
  const {
    data: properties,
    error,
    count,
  } = await query.range((page - 1) * 50, page * 50 - 1);
  if (error) throw new Error("Unable to load properties");
  const url = (n: number) =>
    "/admin/properties?" + new URLSearchParams({ ...p, page: String(n) });
  return (
    <>
      <div className="sec-head">
        <h1>Properties</h1>
        <Link className="btn solid" href="/admin/properties/new">
          Create property
        </Link>
      </div>
      <form className="toolbar">
        <div className="field">
          <label htmlFor="q">Address</label>
          <input id="q" name="q" defaultValue={p.q} />
        </div>
        <div className="field">
          <label htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue={p.visibility}>
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        <button className="btn">Apply</button>
      </form>
      <p>{count} stored properties</p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Price</th>
              <th>Status</th>
              <th>Visibility</th>
              <th>Photos</th>
            </tr>
          </thead>
          <tbody>
            {properties?.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={"/admin/properties/" + p.id}>{p.address}</Link>
                  <br />
                  {p.location}
                </td>
                <td>{money(p.price)}</td>
                <td>{p.listing_status}</td>
                <td>{p.published ? "Published" : "Draft"}</td>
                <td>{p.images.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!properties?.length && (
        <p className="empty">
          No properties found. Create a listing to get started.
        </p>
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
