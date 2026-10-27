import "server-only";
import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
export type OverviewMetrics = {
  total: number;
  new: number;
  qualified: number;
  contacted: number;
  inquiries: number;
  google: number;
  form: number;
  chatbot: number;
};
export async function overviewMetrics(
  db: SupabaseClient<Database>,
  start?: string,
  end?: string,
): Promise<OverviewMetrics> {
  const lead = () => {
    let q = db.from("leads").select("id", { count: "exact" });
    if (start) q = q.gte("created_at", start);
    if (end) q = q.lt("created_at", end);
    return q;
  };
  let inquiries = db.from("inquiries").select("id", { count: "exact" });
  if (start) inquiries = inquiries.gte("created_at", start);
  if (end) inquiries = inquiries.lt("created_at", end);
  const results = await Promise.all([
    lead().limit(1),
    lead().eq("status", "New").limit(1),
    lead().in("status", ["Qualified", "Appointment Scheduled"]).limit(1),
    lead().neq("status", "New").limit(1),
    inquiries.limit(1),
    lead().eq("source", "google").limit(1),
    lead().eq("source", "form").limit(1),
    lead().eq("source", "chatbot").limit(1),
  ]);
  if (results.some((r) => r.error || r.count === null))
    throw new Error("Unable to load overview metrics");
  return Object.fromEntries(
    [
      "total",
      "new",
      "qualified",
      "contacted",
      "inquiries",
      "google",
      "form",
      "chatbot",
    ].map((key, i) => [key, results[i].count!]),
  ) as OverviewMetrics;
}
export type LeadChartRow = { created_at: string; source: string };
export async function overviewChart(
  db: SupabaseClient<Database>,
  start: string,
  end: string,
) {
  const rows: LeadChartRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db
      .from("leads")
      .select("created_at,source")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw new Error("Unable to load lead history");
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

export const overviewTimestamp = () => Date.now();
