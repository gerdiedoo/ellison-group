import { describe, expect, it } from "vitest";
import { queryValues, isRecordId } from "../../lib/validation";
describe("untrusted route query values", () => {
  it("uses the first repeated query value", () =>
    expect(queryValues({ q: ["Chenal", "Hillcrest"], page: "2" })).toEqual({
      q: "Chenal",
      page: "2",
    }));
  it("ignores non-string values and empty arrays", () =>
    expect(queryValues({ q: {}, page: [], status: null, other: 10 })).toEqual(
      {},
    ));
  it("accepts real record IDs and rejects invalid database filters", () => {
    expect(isRecordId("00000000-0000-4000-8000-000000000001")).toBe(true);
    for (const value of [
      undefined,
      "not-a-uuid",
      ["00000000-0000-4000-8000-000000000001"],
    ])
      expect(isRecordId(value)).toBe(false);
  });
});
