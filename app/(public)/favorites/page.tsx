import Link from "next/link";
import { configured, supabase } from "@/lib/supabase/server";
import { PropertyCard } from "@/components/property-card";
import { SaveButton } from "@/components/save-button";
export default async function Favorites() {
  const db = configured() ? await supabase() : null;
  const user = db ? (await db.auth.getUser()).data.user : null;
  if (!db || !user)
    return (
      <div className="wrap page">
        <h1>Your favorites.</h1>
        <p>Sign in to keep your favorite homes together across devices.</p>
        <Link className="btn solid" href="/login?next=/favorites">
          Sign in
        </Link>
      </div>
    );
  const { data: ids, error } = await db
    .from("favorites")
    .select("property_id")
    .eq("user_id", user.id);
  if (error) throw new Error("Unable to load favorites");
  const { data: properties } = ids?.length
    ? await db
        .from("properties")
        .select("*")
        .in(
          "id",
          ids.map((f) => f.property_id),
        )
        .eq("published", true)
    : { data: [] };
  return (
    <div className="wrap page">
      <h1>Your favorites.</h1>
      {properties?.length ? (
        <div className="grid">
          {properties.map((p) => (
            <div key={p.id} className="stack">
              <PropertyCard property={p} />
              <SaveButton id={p.id} initial />
            </div>
          ))}
        </div>
      ) : (
        <p>
          No saved homes yet.{" "}
          <Link className="link" href="/properties">
            Explore homes →
          </Link>
        </p>
      )}
    </div>
  );
}
