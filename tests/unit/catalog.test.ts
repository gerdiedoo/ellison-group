import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  configured: () => true,
  supabase: vi.fn(),
}));
import { supabase } from "../../lib/supabase/server";
import { catalog, neighborhoodCounts } from "../../lib/data";
const q = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  gte: vi.fn(),
};
beforeEach(() => {
  vi.clearAllMocks();
  for (const method of [q.select, q.eq, q.order, q.gte])
    method.mockReturnValue(q);
  q.range.mockResolvedValue({ data: [], error: null, count: 0 });
  vi.mocked(supabase).mockResolvedValue({ from: () => q } as unknown as Awaited<
    ReturnType<typeof supabase>
  >);
});
describe("database catalog boundaries", () => {
  it("does not pass non-finite numeric filters to PostgreSQL", async () => {
    await catalog({ baths: "Infinity", beds: "Infinity", min: "NaN" });
    expect(q.gte).not.toHaveBeenCalled();
  });
  it("keeps numeric bathroom filters functional", async () => {
    await catalog({ baths: "2.5" });
    expect(q.gte).toHaveBeenCalledWith("baths", 2.5);
  });
  it("returns React-serializable counts without inherited-property collisions", async () => {
    q.range.mockResolvedValue({
      data: [
        { neighborhood: "__proto__" },
        { neighborhood: "constructor" },
        { neighborhood: "Chenal" },
      ],
      error: null,
    });
    const counts = await neighborhoodCounts();
    expect(counts).toEqual({ ["__proto__"]: 1, constructor: 1, Chenal: 1 });
    expect(Object.getPrototypeOf(counts)).toBe(Object.prototype);
    expect(JSON.parse(JSON.stringify(counts))).toEqual(counts);
  });
});
