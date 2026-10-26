import "server-only";
import { redirect } from "next/navigation";
import { configured, supabase } from "@/lib/supabase/server";
export async function requireStaff(admin = false) {
  if (!configured()) redirect("/login?error=Supabase+is+not+configured");
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (
    error ||
    !profile?.active ||
    !["agent", "admin"].includes(profile.role) ||
    (admin && profile.role !== "admin")
  )
    redirect("/login?error=Staff+authorization+required");
  return { db, user, profile };
}
