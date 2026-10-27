"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useEffect, useTransition } from "react";
import type { Property } from "@/lib/database.types";

type Row = Pick<
  Property,
  | "id"
  | "address"
  | "location"
  | "property_type"
  | "beds"
  | "baths"
  | "sqft"
  | "price"
  | "listing_status"
  | "published"
> & { inquiries: number; interests: number };
export function RecordsPropertyTable({
  properties,
  query,
}: {
  properties: Row[];
  query: string;
}) {
  const router = useRouter();
  function href(id: string) {
    const params = new URLSearchParams(query);
    params.set("selected", id);
    return "/admin/properties?" + params;
  }
  return (
    <div className="tw rc">
      <table>
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Beds / baths</th>
            <th>Sq ft</th>
            <th>Price</th>
            <th>Status</th>
            <th>Inquiries</th>
            <th>Interested leads</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr
              className="row"
              key={p.id}
              tabIndex={0}
              onClick={(event) => {
                if (!(event.target as HTMLElement).closest("a,button,input"))
                  router.push(href(p.id), { scroll: false });
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !(event.target as HTMLElement).closest("a,button,input")
                )
                  router.push(href(p.id), { scroll: false });
              }}
            >
              <td className="first" data-l="Property">
                <Link className="nm" href={href(p.id)} scroll={false}>
                  {p.address}
                </Link>
                <div className="em">
                  {p.location}
                  {!p.published ? " · Draft" : ""}
                </div>
              </td>
              <td data-l="Type">{p.property_type}</td>
              <td data-l="Beds / baths">
                {p.beds ? `${p.beds} / ${p.baths}` : "—"}
              </td>
              <td data-l="Sq ft">
                {p.sqft ? p.sqft.toLocaleString("en-US") : "—"}
              </td>
              <td data-l="Price">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(p.price)}
              </td>
              <td data-l="Status">
                <span
                  className={
                    "badge " +
                    (p.listing_status === "Pending"
                      ? "s-New"
                      : p.listing_status === "Sold"
                        ? "s-Lost"
                        : "s-Qualified")
                  }
                >
                  {p.listing_status}
                </span>
              </td>
              <td data-l="Inquiries">{p.inquiries}</td>
              <td data-l="Interested leads">{p.interests}</td>
            </tr>
          ))}
          {!properties.length && (
            <tr>
              <td colSpan={8}>
                <div className="empty">
                  <b>No properties match</b>Adjust the filters.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function RecordsPropertyFilters({
  values,
  areas,
}: {
  values: Record<string, string>;
  areas: string[];
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, start] = useTransition();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function filter(form: HTMLFormElement, delay: number) {
    if (timer.current) clearTimeout(timer.current);
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form))
      if (typeof value === "string" && value) params.set(key, value);
    timer.current = setTimeout(
      () =>
        start(() =>
          router.replace("/admin/properties?" + params, { scroll: false }),
        ),
      delay,
    );
  }
  return (
    <form
      action="/admin/properties"
      className="toolbar"
      role="search"
      aria-label="Filter properties"
      onSubmit={(event) => {
        event.preventDefault();
        filter(event.currentTarget, 0);
      }}
      onChange={(event) =>
        filter(
          event.currentTarget,
          event.target instanceof HTMLInputElement ? 350 : 0,
        )
      }
    >
      <input
        type="search"
        name="q"
        placeholder="Search address, area or type"
        aria-label="Search properties"
        defaultValue={values.q}
      />
      <select name="status" aria-label="Status" defaultValue={values.status}>
        <option value="">All statuses</option>
        {["For Sale", "Pending", "Sold"].map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>
      <select name="area" aria-label="Area" defaultValue={values.area}>
        <option value="">All areas</option>
        {areas.map((area) => (
          <option key={area}>{area}</option>
        ))}
      </select>
      <select
        name="visibility"
        aria-label="Visibility"
        defaultValue={values.visibility}
      >
        <option value="">All visibility</option>
        <option value="published">Published</option>
        <option value="draft">Draft</option>
      </select>
      <button type="submit" className="btn ghost sm">
        Apply
      </button>
      {pending && (
        <span className="cnt" role="status">
          Updating…
        </span>
      )}
    </form>
  );
}
