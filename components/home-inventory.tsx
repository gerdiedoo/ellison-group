import Link from "next/link";
import { HomeFilters } from "@/components/home-filters";
import { money, type Search } from "@/lib/data";
import { pageNumber } from "@/lib/validation";
import type { Property } from "@/lib/database.types";
export function HomeInventory({
  properties,
  count,
  unconfigured,
  params,
}: {
  properties: Property[];
  count: number;
  unconfigured: boolean;
  params: Search;
}) {
  const values = Object.fromEntries(
    Object.entries(params).filter(
      (pair): pair is [string, string] => typeof pair[1] === "string",
    ),
  );
  const page = pageNumber(values.page || "");
  function href(n: number) {
    const query = new URLSearchParams(values);
    query.set("page", String(n));
    return "/?" + query.toString() + "#inventory";
  }
  return (
    <section id="inventory" className="home-inventory">
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">All current listings</span>
            <h2>
              The full <em>collection</em>
            </h2>
          </div>
          <p>
            Search stays one click away. Filter by place, bedrooms and price.
          </p>
        </div>
        <HomeFilters
          key={JSON.stringify(values)}
          values={values}
          count={count}
        />
        <div className="cards">
          {properties.length ? (
            properties.map((p) => (
              <Link
                key={p.id}
                className="inventory-card"
                href={"/properties/" + p.slug}
                aria-label={p.address + ", " + money(p.price)}
              >
                <div className="ph">
                  <img
                    className="art"
                    src={
                      p.images[0] || "/illustrations/" + p.illustration + ".svg"
                    }
                    alt={
                      p.images[0]
                        ? p.address
                        : "Conceptual home illustration; not a property photograph"
                    }
                    loading="lazy"
                  />
                  <span
                    className={
                      "tag" + (p.listing_status === "Pending" ? " pending" : "")
                    }
                  >
                    {p.listing_status}
                  </span>
                  {!p.images[0] && <span className="note">Illustration</span>}
                </div>
                <h3>{p.address}</h3>
                <div className="meta">
                  <span>
                    {p.beds
                      ? `${p.beds} bd · ${p.baths} ba · ${p.sqft.toLocaleString()} sf`
                      : "Vacant lot"}
                  </span>
                  <b>{money(p.price)}</b>
                </div>
                <div className="meta">
                  <span>{p.location}</span>
                </div>
              </Link>
            ))
          ) : (
            <p className="empty">
              {unconfigured
                ? "Current listings are unavailable. Please contact our team for help."
                : "No homes match these filters. Try widening your search."}{" "}
              <Link className="link" href="/contact">
                Talk with us →
              </Link>
            </p>
          )}
        </div>
        {(page > 1 || page * 12 < count) && (
          <nav
            className="inventory-pagination"
            aria-label="Home listings pagination"
          >
            {page > 1 && (
              <Link className="btn ghost" href={href(page - 1)}>
                ← Previous
              </Link>
            )}
            {page * 12 < count && (
              <Link className="btn ghost" href={href(page + 1)}>
                More homes →
              </Link>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
