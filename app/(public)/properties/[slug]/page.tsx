import { notFound } from "next/navigation";
import { configured, supabase } from "@/lib/supabase/server";
import { money } from "@/lib/data";
import { settings } from "@/lib/settings";
import { PropertyInquiry } from "@/components/property-actions";
import { PropertyCard } from "@/components/property-card";
import { SaveButton } from "@/components/save-button";
import Link from "next/link";
export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!configured()) notFound();
  const { slug } = await params;
  const db = await supabase();
  const { data: p, error } = await db
    .from("properties")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error("Unable to load property");
  if (!p) notFound();
  const { capture, assistant } = await settings();
  const { data: similar } = await db
    .from("properties")
    .select("*")
    .eq("published", true)
    .eq("neighborhood", p.neighborhood)
    .neq("id", p.id)
    .limit(3);
  const {
    data: { user },
  } = await db.auth.getUser();
  const saved = user
    ? !!(
        await db
          .from("favorites")
          .select("property_id")
          .eq("property_id", p.id)
          .eq("user_id", user.id)
          .maybeSingle()
      ).data
    : false;
  return (
    <div className="wrap page">
      <Link className="link" href="/properties">
        ← All homes
      </Link>
      <div className="sec-head" style={{ marginTop: 30 }}>
        <div>
          <span className="eyebrow">
            {p.neighborhood} · {p.listing_status}
          </span>
          <h1>{p.address}</h1>
          <p>{p.location}</p>
        </div>
        <SaveButton id={p.id} initial={saved} />
      </div>
      <div
        className="gallery"
        role="region"
        tabIndex={0}
        aria-label="Property image gallery"
      >
        {(p.images.length
          ? p.images
          : ["/illustrations/" + p.illustration + ".svg"]
        ).map((url, i) => (
          <img
            key={url}
            src={url}
            alt={
              p.images.length
                ? `${p.address}, image ${i + 1}`
                : "Conceptual illustration; not a photograph of this property"
            }
          />
        ))}
      </div>
      {!p.images.length && (
        <p className="muted">
          Illustration only. Property photographs have not been added.
        </p>
      )}
      <div className="two-cols" style={{ marginTop: 40 }}>
        <div>
          <span className="price">{money(p.price)}</span>
          <div className="spec">
            <span>{p.beds} beds</span>
            <span>{p.baths} baths</span>
            <span>{p.sqft.toLocaleString()} sq ft</span>
            <span>{p.property_type}</span>
          </div>
          <h2>A closer look.</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {p.description ||
              "Contact our team for further details about this home."}
          </p>
          <ul>
            {p.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="muted">
            Listing information may change. Availability and showing times
            require confirmation.
          </p>
        </div>
        <PropertyInquiry
          id={p.id}
          address={p.address}
          assistantEnabled={assistant.enabled}
          config={capture}
        />
      </div>
      {!!similar?.length && (
        <>
          <h2>More to consider.</h2>
          <div className="grid">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
