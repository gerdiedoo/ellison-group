import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
export type LeadFilters = {
  q?: string;
  status?: string;
  agent?: string;
  source?: string;
  since?: string;
  sort?: string;
  page?: string;
};
export function leadQuery(db: SupabaseClient<Database>, p: LeadFilters) {
  let query = db.from("leads").select("*", { count: "exact" });
  const q = (p.q || "")
    .replace(/[^\p{L}\p{N}\s'@+-]/gu, " ")
    .trim()
    .slice(0, 100);
  if (q)
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  if (p.status) query = query.eq("status", p.status);
  if (p.agent)
    query =
      p.agent === "unassigned"
        ? query.is("assigned_to", null)
        : query.eq("assigned_to", p.agent);
  if (p.source) query = query.eq("source", p.source.slice(0, 100));
  if (
    p.since &&
    /^\d{4}-\d{2}-\d{2}$/.test(p.since) &&
    !Number.isNaN(Date.parse(p.since))
  )
    query = query.gte("created_at", p.since + "T00:00:00Z");
  return query
    .order(p.sort === "name" ? "full_name" : "created_at", {
      ascending: p.sort === "name" || p.sort === "oldest",
    })
    .order("id");
}
