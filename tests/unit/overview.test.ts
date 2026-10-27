import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { overviewMetrics, overviewChart } from "../../lib/overview";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types";
function client(results: unknown[]) {
  const gte = vi.fn(),
    lt = vi.fn(),
    inside = vi.fn();
  let index = 0;
  const from = vi.fn(() => {
    const q = {
      select: () => q,
      gte: (...args: unknown[]) => {
        gte(...args);
        return q;
      },
      lt: (...args: unknown[]) => {
        lt(...args);
        return q;
      },
      eq: () => q,
      neq: () => q,
      in: (...args: unknown[]) => {
        inside(...args);
        return q;
      },
      order: () => q,
      limit: () => Promise.resolve(results[index++]),
      range: () => Promise.resolve(results[index++]),
    };
    return q;
  });
  return {
    db: { from } as unknown as SupabaseClient<Database>,
    gte,
    lt,
    inside,
  };
}
describe("database-backed prototype overview", () => {
  it("maps all eight real counts and applies the same period to every metric", async () => {
    const c = client(
      Array.from({ length: 8 }, (_, count) => ({ count, error: null })),
    );
    expect(await overviewMetrics(c.db, "2026-01-01", "2026-02-01")).toEqual({
      total: 0,
      new: 1,
      qualified: 2,
      contacted: 3,
      inquiries: 4,
      google: 5,
      form: 6,
      chatbot: 7,
    });
    expect(c.gte).toHaveBeenCalledTimes(8);
    expect(c.lt).toHaveBeenCalledTimes(8);
    expect(c.inside).toHaveBeenCalledWith("status", [
      "Qualified",
      "Appointment Scheduled",
    ]);
  });
  it("never replaces a missing database count with a made-up zero", async () => {
    const c = client(
      Array.from({ length: 8 }, () => ({ count: null, error: null })),
    );
    await expect(overviewMetrics(c.db)).rejects.toThrow(
      "Unable to load overview metrics",
    );
  });
  it("fails visibly on query errors", async () => {
    const c = client(
      Array.from({ length: 8 }, () => ({
        count: 0,
        error: { message: "offline" },
      })),
    );
    await expect(overviewMetrics(c.db)).rejects.toThrow(
      "Unable to load overview metrics",
    );
  });
  it("pages complete chart history past Supabase's default row limit", async () => {
    const row = { created_at: "2026-01-03T12:00:00Z", source: "form" };
    const c = client([
      { data: Array.from({ length: 1000 }, () => row), error: null },
      { data: [row], error: null },
    ]);
    expect(await overviewChart(c.db, "2026-01-01", "2026-02-01")).toHaveLength(
      1001,
    );
  });
});
