import { describe, it, expect } from "vitest";
import { factualReply, selectionSchema } from "../../lib/chat-policy";
const id = "00000000-0000-4000-8000-000000000010";
const p = {
  id,
  address: "Verified Home",
  location: "Little Rock",
  price: 500000,
  beds: 3,
  baths: 2,
  sqft: 2000,
  listing_status: "Pending",
  features: ["Garden"],
  description: "Recorded description.",
  slug: "verified-home",
};
const company = {
  name: "The Ellison Group",
  phone: "501-725-1227",
  address: "Little Rock",
};
describe("grounded assistant output", () => {
  it("renders price and availability exclusively from stored records", () => {
    const result = factualReply(
      { intent: "features", propertyIds: [id] },
      [p],
      company,
      true,
    );
    expect(result).toContain("$500,000");
    expect(result).toContain("Pending");
    expect(result).toContain("Garden");
  });
  it("discards invented model listing IDs", () => {
    const result = factualReply(
      {
        intent: "search",
        propertyIds: ["00000000-0000-4000-8000-000000000099"],
      },
      [p],
      company,
      true,
    );
    expect(result).not.toContain("Verified Home");
    expect(result).toContain("don’t have verified information");
  });
  it("does not answer an unsupported question with unrelated valid records", () => {
    const result = factualReply(
      { intent: "unknown", propertyIds: [id] },
      [p],
      company,
      true,
    );
    expect(result).toContain("don’t have verified information");
    expect(result).not.toContain("$500,000");
  });
  it("does not generate valuations", () =>
    expect(
      factualReply(
        { intent: "valuation", propertyIds: [] },
        [p],
        company,
        true,
      ),
    ).toContain("cannot estimate a price"));
  it("offers configured human help", () =>
    expect(
      factualReply({ intent: "handoff", propertyIds: [] }, [p], company, false),
    ).toContain(company.phone));
  it("validates model response shape", () =>
    expect(
      selectionSchema.safeParse({ intent: "invent", propertyIds: [id] })
        .success,
    ).toBe(false));
});
