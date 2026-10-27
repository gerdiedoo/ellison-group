import { describe, it, expect } from "vitest";
import {
  pageNumber,
  captureSchema,
  emailSchema,
  safeNext,
  propertySchema,
  assistantSchema,
} from "../../lib/validation";
const base = {
  request_id: "00000000-0000-4000-8000-000000000001",
  full_name: "A Visitor",
  email: " Visitor@EXAMPLE.com ",
  phone: "5015551234",
  kind: "General",
  consent: true,
  website: "",
};
describe("public input validation", () => {
  it("normalizes email on the server", () =>
    expect(emailSchema.parse(" A@Example.com ")).toBe("a@example.com"));
  it("rejects malformed email", () =>
    expect(emailSchema.safeParse("invalid").success).toBe(false));
  it("requires explicit consent", () =>
    expect(captureSchema.safeParse({ ...base, consent: false }).success).toBe(
      false,
    ));
  it("rejects honeypot submissions", () =>
    expect(
      captureSchema.safeParse({ ...base, website: "bot.site" }).success,
    ).toBe(false));
  it("accepts an ordinary inquiry", () =>
    expect(captureSchema.parse(base).email).toBe("visitor@example.com"));
  it("requires a valuation address", () =>
    expect(
      captureSchema.safeParse({ ...base, kind: "Valuation request" }).success,
    ).toBe(false));
  it("preserves valuation context", () =>
    expect(
      captureSchema.parse({
        ...base,
        kind: "Valuation request",
        context: { address: "123 Main Street", beds: "3" },
      }).context.address,
    ).toBe("123 Main Street"));
  it("requires a showing preference", () =>
    expect(
      captureSchema.safeParse({ ...base, kind: "Showing request" }).success,
    ).toBe(false));
  it("rejects past dates", () =>
    expect(
      captureSchema.safeParse({
        ...base,
        kind: "Showing request",
        preferred_date: "2000-01-01",
      }).success,
    ).toBe(false));
  it("requires an idempotency key", () =>
    expect(
      captureSchema.safeParse({ ...base, request_id: "random" }).success,
    ).toBe(false));
  it("rejects oversized messages", () =>
    expect(
      captureSchema.safeParse({ ...base, message: "x".repeat(5001) }).success,
    ).toBe(false));
  it("does not accept a client lead ownership claim", () =>
    expect(
      captureSchema.parse({ ...base, lead_id: "attacker" }),
    ).not.toHaveProperty("lead_id"));
});
describe("redirect protection", () => {
  it("allows a local destination", () =>
    expect(safeNext("/favorites")).toBe("/favorites"));
  it.each([
    "//evil.example",
    "https://evil.example",
    "/\\evil.example",
    "/\n/evil.example",
    null,
  ])("rejects external or ambiguous next %s", (v) =>
    expect(safeNext(v)).toBe("/admin"),
  );
});
describe("admin input validation", () => {
  const property = {
    slug: "a-home",
    address: "123 Main",
    location: "Little Rock, AR",
    neighborhood: "Chenal",
    property_type: "Estate home",
    price: "500000",
    beds: "3",
    baths: "2.5",
    sqft: "3000",
    description: "",
    features: ["Garden"],
    listing_status: "For Sale",
    published: false,
    assigned_to: null,
    illustration: "stone",
  };
  it("accepts fractional bathroom counts and coerces numeric form values", () =>
    expect(propertySchema.parse(property).baths).toBe(2.5));
  it("rejects negative listing prices", () =>
    expect(propertySchema.safeParse({ ...property, price: -1 }).success).toBe(
      false,
    ));
  it("rejects unsafe slugs", () =>
    expect(
      propertySchema.safeParse({ ...property, slug: "../../admin" }).success,
    ).toBe(false));
  it("rejects unknown assistant settings", () =>
    expect(
      assistantSchema.parse({
        enabled: true,
        welcome: "Hello",
        tone: "Warm",
        instructions: "Help",
        handoffEnabled: true,
        apiKey: "secret",
      }),
    ).not.toHaveProperty("apiKey"));
});

describe("search pagination boundaries", () => {
  it.each([
    ["Infinity", 1],
    ["-2", 1],
    ["2.9", 2],
    ["20000", 10000],
  ])("bounds page %s to %s", (input, expected) =>
    expect(pageNumber(input)).toBe(expected),
  );
});

describe("public inquiry preferences", () => {
  it("retains validated showing time and contact preferences", () => {
    expect(
      captureSchema.parse({
        ...base,
        context: {
          preferred_time: "Afternoon (12–5)",
          contact_method: "Email",
          purpose: "Buying",
        },
      }).context,
    ).toMatchObject({
      preferred_time: "Afternoon (12–5)",
      contact_method: "Email",
      purpose: "Buying",
    });
  });
  it("rejects unsupported showing slots", () =>
    expect(
      captureSchema.safeParse({
        ...base,
        context: { preferred_time: "Unconfirmed midnight booking" },
      }).success,
    ).toBe(false));
});
