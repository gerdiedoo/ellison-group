import { pageNumber } from "@/lib/validation";
import Link from "next/link";
import { catalog, type Search } from "@/lib/data";
import { PropertyCard } from "@/components/property-card";
export const metadata = { title: "Homes in Little Rock" };
export default async function Properties({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const p = await searchParams;
  const { properties, count, unconfigured } = await catalog(p);
  const val = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  const page = pageNumber(val("page"));
  function href(n: number) {
    const q = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      if (typeof v === "string") q.set(k, v);
    });
    q.set("page", String(n));
    return "/properties?" + q.toString();
  }
  return (
    <div className="wrap page">
      <span className="eyebrow">Our current selection</span>
      <h1>
        Find <em>your place.</em>
      </h1>
      <form className="toolbar" method="get">
        <div className="field">
          <label htmlFor="q">Search</label>
          <input
            id="q"
            name="q"
            defaultValue={val("q")}
            placeholder="Address or city"
          />
        </div>
        <div className="field">
          <label htmlFor="area">Neighborhood</label>
          <select id="area" name="area" defaultValue={val("area")}>
            <option value="">All areas</option>
            {[
              "The Heights",
              "Hillcrest",
              "Historic Downtown",
              "Chenal",
              "Maumelle",
              "Pleasant Valley",
              "Beyond Little Rock",
            ].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="min">Min price</label>
          <input
            id="min"
            name="min"
            type="number"
            min="0"
            defaultValue={val("min")}
          />
        </div>
        <div className="field">
          <label htmlFor="max">Max price</label>
          <input
            id="max"
            name="max"
            type="number"
            min="0"
            defaultValue={val("max")}
          />
        </div>
        <div className="field">
          <label htmlFor="beds">Min beds</label>
          <select id="beds" name="beds" defaultValue={val("beds")}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="type">Property type</label>
          <select id="type" name="type" defaultValue={val("type")}>
            <option value="">Any type</option>
            {[
              "Estate home",
              "Single-family",
              "Historic home",
              "Ranch",
              "Condo",
              "Land",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="baths">Min baths</label>
          <select id="baths" name="baths" defaultValue={val("baths")}>
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={val("status")}>
            <option value="">All statuses</option>
            {["For Sale", "Pending", "Sold"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={val("sort")}>
            <option value="price-desc">Price: high to low</option>
            <option value="price-asc">Price: low to high</option>
            <option value="newest">Newest</option>
          </select>
        </div>
        <button className="btn solid">Find homes</button>
        <Link className="text-button" href="/properties">
          Clear
        </Link>
      </form>
      <p aria-live="polite">{count} homes in our current selection</p>
      {unconfigured ? (
        <p className="notice">
          Property data is unavailable until Supabase is configured. Please
          contact our team for current listings.
        </p>
      ) : !properties.length ? (
        <p className="empty">
          No homes match these filters. Try another area or contact us about
          upcoming homes.
        </p>
      ) : (
        <div className="grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
      <nav className="toolbar" aria-label="Pagination">
        {page > 1 && (
          <Link className="btn ghost" href={href(page - 1)}>
            ← Previous
          </Link>
        )}
        {page * 12 < count && (
          <Link className="btn ghost" href={href(page + 1)}>
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
