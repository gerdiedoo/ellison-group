import "server-only";
import { configured, supabase } from "@/lib/supabase/server";
import { pageNumber } from "@/lib/validation";
export type Search = Record<string, string | string[] | undefined>;
export async function catalog(params: Search = {}) {
  if (!configured()) return { properties: [], count: 0, unconfigured: true };
  const db = await supabase();
  let query = db
    .from("properties")
    .select("*", { count: "exact" })
    .eq("published", true);
  const str = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : "";
  const q = str("q")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .trim()
    .slice(0, 100);
  if (q) query = query.or(`address.ilike.%${q}%,location.ilike.%${q}%`);
  if (str("area")) query = query.eq("neighborhood", str("area"));
  if (["For Sale", "Pending", "Sold"].includes(str("status")))
    query = query.eq(
      "listing_status",
      str("status") as "For Sale" | "Pending" | "Sold",
    );
  if (str("type")) query = query.eq("property_type", str("type"));
  if (Number.isFinite(Number(str("baths"))) && Number(str("baths")) > 0)
    query = query.gte("baths", Number(str("baths")));
  const min = Number(str("min")),
    max = Number(str("max")),
    beds = Number(str("beds"));
  if (Number.isFinite(min) && min > 0) query = query.gte("price", min);
  if (Number.isFinite(max) && max > 0) query = query.lte("price", max);
  if (Number.isFinite(beds) && beds > 0) query = query.gte("beds", beds);
  const sort = str("sort");
  query = query.order(sort === "newest" ? "created_at" : "price", {
    ascending: sort === "price-asc",
  });
  query = query.order("id");
  const page = pageNumber(str("page"));
  const { data, error, count } = await query.range(
    (page - 1) * 12,
    page * 12 - 1,
  );
  if (error) throw new Error("Unable to load listings. Please try again.");
  return { properties: data || [], count: count || 0, unconfigured: false };
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export async function neighborhoodCounts() {
  if (!configured()) return {} as Record<string, number>;
  const db = await supabase();
  const counts: Record<string, number> = Object.create(null);
  // Page through the public projection instead of silently truncating at the API row limit.
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("properties")
      .select("neighborhood")
      .eq("published", true)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw new Error("Unable to load neighborhood availability.");
    for (const p of data)
      counts[p.neighborhood] = (counts[p.neighborhood] || 0) + 1;
    if (data.length < 1000) break;
  }
  return { ...counts };
}
