import Link from "next/link";
import type { Property } from "@/lib/database.types";
import { money } from "@/lib/data";
export function PropertyCard({ property: p }: { property: Property }) {
  return (
    <article className="card property">
      <Link href={"/properties/" + p.slug} aria-label={"View " + p.address}>
        <div style={{ position: "relative" }}>
          <img
            src={p.images[0] || "/illustrations/" + p.illustration + ".svg"}
            alt={
              p.images[0]
                ? p.address
                : "Conceptual home illustration; not a property photograph"
            }
            loading="lazy"
          />
          <span className="tag">{p.listing_status}</span>
          {!p.images[0] && <span className="note">Illustration</span>}
        </div>
        <div className="body">
          <span className="eyebrow">{p.neighborhood}</span>
          <h3>{p.address}</h3>
          <p className="muted">{p.location}</p>
          <div className="spec">
            <span>{p.beds} beds</span>
            <span>{p.baths} baths</span>
            <span>{p.sqft.toLocaleString()} sq ft</span>
          </div>
          <span className="price">{money(p.price)}</span>
          <span className="link">Explore this home →</span>
        </div>
      </Link>
    </article>
  );
}
