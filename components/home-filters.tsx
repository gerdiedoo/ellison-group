"use client";
import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
const areas = [
  ["", "All areas"],
  ["Chenal", "Chenal"],
  ["Pleasant Valley", "Pleasant Valley"],
  ["Historic Downtown", "Downtown"],
  ["Beyond Little Rock", "Beyond Little Rock"],
];
export function HomeFilters({
  values,
  count,
}: {
  values: Record<string, string>;
  count: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  function navigate(form: HTMLFormElement, area?: string) {
    const data = new FormData(form);
    if (area !== undefined) data.set("area", area);
    const params = new URLSearchParams();
    for (const [key, value] of data)
      if (typeof value === "string" && value) params.set(key, value);
    start(() =>
      router.replace("/?" + params.toString() + "#inventory", {
        scroll: false,
      }),
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(event.currentTarget);
  }
  return (
    <form
      action="/#inventory"
      method="get"
      className="filters home-filters"
      aria-label="Filter homes"
      aria-busy={pending}
      onSubmit={submit}
    >
      <input type="hidden" name="area" value={values.area || ""} />
      <div className="group" aria-label="Neighborhood">
        {areas.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className="fbtn"
            aria-pressed={(values.area || "") === value}
            disabled={pending}
            onClick={(event) => navigate(event.currentTarget.form!, value)}
          >
            {label}
          </button>
        ))}
      </div>
      <select
        name="beds"
        aria-label="Bedrooms"
        defaultValue={values.beds || ""}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">Any beds</option>
        <option value="3">3+ beds</option>
        <option value="4">4+ beds</option>
        <option value="5">5+ beds</option>
      </select>
      <select
        name="max"
        aria-label="Maximum price"
        defaultValue={values.max || ""}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">Any price</option>
        <option value="300000">Up to $300K</option>
        <option value="500000">Up to $500K</option>
        <option value="750000">Up to $750K</option>
        <option value="1000000">Up to $1M</option>
      </select>
      <select
        name="sort"
        aria-label="Sort homes"
        defaultValue={values.sort || "price-desc"}
        disabled={pending}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="price-desc">Price, high to low</option>
        <option value="price-asc">Price, low to high</option>
        <option value="newest">Newest</option>
      </select>
      <label className="check">
        <input
          type="checkbox"
          name="status"
          value="For Sale"
          defaultChecked={values.status === "For Sale"}
          disabled={pending}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        />{" "}
        Available only
      </label>
      <div className="inventory-search">
        <input
          name="q"
          aria-label="Search homes"
          type="search"
          placeholder="Search address or city"
          defaultValue={values.q || ""}
          maxLength={100}
          disabled={pending}
        />
        <button className="fbtn" disabled={pending}>
          Search
        </button>
      </div>
      <span className="count" aria-live="polite">
        {pending
          ? "Finding homes…"
          : `${count} ${count === 1 ? "home" : "homes"}`}
      </span>
    </form>
  );
}
