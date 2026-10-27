import { isRecordId } from "@/lib/validation";
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
  range?: string;
  dir?: string;
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
  if (p.agent === "unassigned" || isRecordId(p.agent))
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
  if (["7", "30", "90"].includes(p.range || ""))
    query = query.gte(
      "created_at",
      new Date(Date.now() - Number(p.range) * 86400000).toISOString(),
    );
  const columns = [
    "full_name",
    "email",
    "phone",
    "source",
    "status",
    "assigned_to",
    "updated_at",
    "created_at",
  ];
  const aliases: Record<string, string> = {
    name: "full_name",
    newest: "created_at",
    oldest: "created_at",
  };
  const column =
    aliases[p.sort || ""] ||
    (columns.includes(p.sort || "") ? p.sort! : "created_at");
  const ascending = p.dir
    ? p.dir === "asc"
    : p.sort === "name" || p.sort === "oldest";
  return query.order(column, { ascending }).order("id");
}
