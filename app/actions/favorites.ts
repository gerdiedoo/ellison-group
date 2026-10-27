"use server";
import { supabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function toggleFavorite(id: string) {
  const db = await supabase();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Sign in to save favorites across devices." };
  const property = z.uuid().parse(id);
  const { data: existing, error: readError } = await db
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id)
    .eq("property_id", property)
    .maybeSingle();
  if (readError) return { error: "Unable to read favorites. Please retry." };
  const { error } = existing
    ? await db
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("property_id", property)
    : await db
        .from("favorites")
        .insert({ user_id: user.id, property_id: property });
  if (error) return { error: "Unable to update favorites." };
  revalidatePath("/favorites");
  return { saved: !existing };
}
