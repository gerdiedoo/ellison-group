import { isRecordId, pageNumber, queryValues } from "@/lib/validation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { money } from "@/lib/data";
import {
  RecordsPropertyFilters,
  RecordsPropertyTable,
} from "@/components/admin/records-property-table";
import { RecordsPropertyDrawer } from "@/components/admin/records-property-drawer";
import { propertySummary } from "@/components/admin/records-property-data";

type DrawerInquiry = {
  id: string;
  kind: string;
  status: string;
  lead_id: string;
  created_at: string;
  preferred_date: string | null;
  lead: { full_name: string } | null;
};
type DrawerInterest = {
  lead_id: string;
  lead: { id: string; full_name: string; email: string; status: string } | null;
};
export default async function Properties({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const values = queryValues(await searchParams);
  const { db } = await requireStaff();
  if (values.selected && !isRecordId(values.selected)) notFound();
  let query = db
    .from("properties")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id");
  const search = (values.q || "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .trim()
    .slice(0, 100);
  if (search)
    query = query.or(
      `address.ilike.%${search}%,location.ilike.%${search}%,property_type.ilike.%${search}%,neighborhood.ilike.%${search}%`,
    );
  if (["published", "draft"].includes(values.visibility))
    query = query.eq("published", values.visibility === "published");
  if (["For Sale", "Pending", "Sold"].includes(values.status))
    query = query.eq(
      "listing_status",
      values.status as "For Sale" | "Pending" | "Sold",
    );
  if (values.area) query = query.eq("neighborhood", values.area);
  const page = pageNumber(values.page);
  const [result, summary] = await Promise.all([
    query.range((page - 1) * 50, page * 50 - 1),
    propertySummary(db),
  ]);
  if (result.error) throw new Error("Unable to load properties");
  const selected = values.selected
    ? await db
        .from("properties")
        .select("*")
        .eq("id", values.selected)
        .maybeSingle()
    : null;
  if (selected?.error) throw new Error("Unable to load property details");
  if (selected && !selected.data) notFound();
  const property = selected?.data;
  const inquiries: DrawerInquiry[] = [];
  const interested: DrawerInterest[] = [];
  if (property) {
    for (let offset = 0; ;) {
      const { data, count, error } = await db
        .from("inquiries")
        .select(
          "id,kind,status,lead_id,created_at,preferred_date,lead:leads(full_name)",
          { count: "exact" },
        )
        .eq("property_id", property.id)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
      if (error || !data || count === null)
        throw new Error("Unable to load property inquiries");
      inquiries.push(...data);
      offset += data.length;
      if (!data.length || offset >= count) break;
    }
    for (let offset = 0; ;) {
      const { data, count, error } = await db
        .from("lead_properties")
        .select("lead_id,lead:leads(id,full_name,email,status)", {
          count: "exact",
        })
        .eq("property_id", property.id)
        .order("lead_id")
        .range(offset, offset + 999);
      if (error || !data || count === null)
        throw new Error("Unable to load interested leads");
      interested.push(...data);
      offset += data.length;
      if (!data.length || offset >= count) break;
    }
  }
  const base = new URLSearchParams(values);
  base.delete("selected");
  const baseHref = "/admin/properties" + (base.size ? "?" + base : "");
  const pageHref = (n: number) => {
    const params = new URLSearchParams(base);
    params.set("page", String(n));
    return "/admin/properties?" + params;
  };
  const areas = [
    ...new Set([
      "The Heights",
      "Hillcrest",
      "Historic Downtown",
      "Chenal",
      "Maumelle",
      "Pleasant Valley",
      "Beyond Little Rock",
      ...result.data!.map((p) => p.neighborhood),
    ]),
  ];
  return (
    <>
      <div className="ph">
        <div>
          <h1>Properties</h1>
          <p>
            The same listings as the public site, with inquiry and lead
            interest.
          </p>
        </div>
        <Link className="btn solid" href="/admin/properties/new">
          Create property
        </Link>
      </div>
      <div className="grid g4">
        <div className="card kpi">
          <div className="l">Listings</div>
          <div className="v">{summary.listings.length}</div>
          <div className="d">
            {
              summary.listings.filter((p) => p.listing_status === "For Sale")
                .length
            }{" "}
            for sale ·{" "}
            {
              summary.listings.filter((p) => p.listing_status === "Pending")
                .length
            }{" "}
            pending
          </div>
        </div>
        <div className="card kpi">
          <div className="l">Property inquiries</div>
          <div className="v">{summary.propertyInquiries}</div>
          <div className="d">All time</div>
        </div>
        <div className="card kpi">
          <div className="l">Showing requests</div>
          <div className="v">{summary.showingRequests}</div>
          <div className="d">All time</div>
        </div>
        <div className="card kpi">
          <div className="l">Most inquired</div>
          <div className="v" style={{ fontSize: 22, lineHeight: 1.25 }}>
            {summary.most?.address || "No inquiries yet"}
          </div>
          <div className="d">
            {summary.most ? summary.inquiries.get(summary.most.id) : 0}{" "}
            inquiries
          </div>
        </div>
      </div>
      <RecordsPropertyFilters values={values} areas={areas} />
      <RecordsPropertyTable
        properties={(result.data || []).map((p) => ({
          ...p,
          inquiries: summary.inquiries.get(p.id) || 0,
          interests: summary.interests.get(p.id) || 0,
        }))}
        query={base.toString()}
      />
      <nav
        className="toolbar"
        aria-label="Property pagination"
        style={{ marginTop: 14 }}
      >
        {page > 1 && (
          <Link className="btn sm ghost" href={pageHref(page - 1)}>
            Previous
          </Link>
        )}
        {page * 50 < (result.count || 0) && (
          <Link className="btn sm ghost" href={pageHref(page + 1)}>
            Next
          </Link>
        )}
        <span className="cnt">{result.count} stored properties</span>
      </nav>
      {property && (
        <RecordsPropertyDrawer
          title={property.address}
          description={`${property.property_type} · ${property.listing_status}`}
          location={property.location}
          closeHref={baseHref}
        >
          <div className="grid g3" style={{ gap: 10 }}>
            {[
              ["Price", money(property.price)],
              [
                "Beds / baths",
                property.beds ? `${property.beds} / ${property.baths}` : "—",
              ],
              [
                "Sq ft",
                property.sqft ? property.sqft.toLocaleString("en-US") : "—",
              ],
            ].map(([label, value]) => (
              <div className="card kpi" key={label}>
                <div className="l">{label}</div>
                <div className="v" style={{ fontSize: 24 }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div className="pill-row" style={{ margin: "6px 0 18px" }}>
            {property.published && (
              <Link className="btn sm" href={"/properties/" + property.slug}>
                View on public site
              </Link>
            )}
            <Link
              className="btn sm solid"
              href={"/admin/properties/" + property.id}
            >
              Edit property
            </Link>
            {!property.published && (
              <span className="badge s-Contacted">Unpublished draft</span>
            )}
          </div>
          <h3 style={{ fontSize: 19, marginBottom: 6 }}>
            Inquiries ({inquiries.length})
          </h3>
          {inquiries.length ? (
            inquiries.map((i) => (
              <div className="li" key={i.id}>
                <div className="b">
                  <div className="t">
                    <Link href={"/admin/inquiries/" + i.id}>{i.kind}</Link>{" "}
                    <span className="badge s-Contacted">{i.status}</span>
                  </div>
                  <div className="m">
                    <Link href={"/admin/leads/" + i.lead_id}>
                      {i.lead?.full_name || "View lead"}
                    </Link>{" "}
                    ·{" "}
                    {new Date(i.created_at).toLocaleString("en-US", {
                      timeZone: "America/Chicago",
                    })}
                    {i.preferred_date ? " · wants " + i.preferred_date : ""}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="m" style={{ color: "var(--muted)" }}>
              No inquiries yet.
            </div>
          )}
          <h3 style={{ fontSize: 19, margin: "20px 0 6px" }}>
            Interested leads ({interested.length})
          </h3>
          {interested.length ? (
            interested.map(({ lead_id, lead }) => (
              <Link
                className="li"
                key={lead_id}
                href={"/admin/leads/" + lead_id}
              >
                <div className="b">
                  <div className="t">{lead?.full_name || "View lead"}</div>
                  <div className="m">{lead?.email}</div>
                </div>
                <span
                  className={"badge s-" + (lead?.status.split(" ")[0] || "New")}
                >
                  {lead?.status}
                </span>
              </Link>
            ))
          ) : (
            <div className="m" style={{ color: "var(--muted)" }}>
              No leads yet.
            </div>
          )}
        </RecordsPropertyDrawer>
      )}
    </>
  );
}
