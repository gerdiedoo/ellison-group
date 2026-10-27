import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function propertySummary(db: SupabaseClient<Database>) {
  const listings: { id: string; address: string; listing_status: string }[] =
    [];
  const inquiries = new Map<string, number>();
  const interests = new Map<string, number>();
  let propertyInquiries = 0;
  let showingRequests = 0;
  for (let offset = 0; ;) {
    const { data, error, count } = await db
      .from("properties")
      .select("id,address,listing_status", { count: "exact" })
      .order("id")
      .range(offset, offset + 999);
    if (error || !data || count === null)
      throw new Error("Unable to load listing totals");
    listings.push(...data);
    offset += data.length;
    if (!data.length || offset >= count) break;
  }
  for (let offset = 0; ;) {
    const { data, error, count } = await db
      .from("inquiries")
      .select("id,property_id,kind", { count: "exact" })
      .order("id")
      .range(offset, offset + 999);
    if (error || !data || count === null)
      throw new Error("Unable to load property inquiry totals");
    for (const row of data) {
      if (row.property_id) {
        propertyInquiries++;
        inquiries.set(
          row.property_id,
          (inquiries.get(row.property_id) || 0) + 1,
        );
      }
      if (row.kind === "Showing request") showingRequests++;
    }
    offset += data.length;
    if (!data.length || offset >= count) break;
  }
  for (let offset = 0; ;) {
    const { data, error, count } = await db
      .from("lead_properties")
      .select("lead_id,property_id", { count: "exact" })
      .order("lead_id")
      .order("property_id")
      .range(offset, offset + 999);
    if (error || !data || count === null)
      throw new Error("Unable to load property interest totals");
    for (const row of data)
      interests.set(row.property_id, (interests.get(row.property_id) || 0) + 1);
    offset += data.length;
    if (!data.length || offset >= count) break;
  }
  const most = listings
    .filter((p) => inquiries.has(p.id))
    .sort((a, b) => (inquiries.get(b.id) || 0) - (inquiries.get(a.id) || 0))[0];
  return {
    listings,
    inquiries,
    interests,
    propertyInquiries,
    showingRequests,
    most,
  };
}
