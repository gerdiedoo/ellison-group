import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function removePropertyPhotos(
  db: SupabaseClient<Database>,
  id: string,
  urls: string[],
) {
  const bucket = db.storage.from("property-images");
  const prefix = bucket.getPublicUrl(`properties/${id}/`).data.publicUrl;
  const paths = urls
    .filter((url) => url.startsWith(prefix))
    .map((url) => `properties/${id}/` + url.slice(prefix.length));
  if (!paths.length) return;
  const { error } = await bucket.remove(paths);
  if (error)
    throw new Error(
      "Unable to remove listing photos. The property record has been retained; please retry.",
    );
}
