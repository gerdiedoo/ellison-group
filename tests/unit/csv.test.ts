import { describe, it, expect } from "vitest";
import { csvCell } from "../../lib/csv";
describe("private CRM CSV export", () => {
  it("quotes commas and embedded quotes", () =>
    expect(csvCell('A, "B"')).toBe('"A, ""B"""'));
  it.each(["=1+1", "+cmd", "-cmd", "@SUM(A1)", "  =cmd"])(
    "neutralizes spreadsheet formulas %s",
    (s) => expect(csvCell(s)).toBe("\"'" + s + '"'),
  );
  it("preserves ordinary values and empty fields", () => {
    expect(csvCell("A Visitor")).toBe('"A Visitor"');
    expect(csvCell(null)).toBe('""');
  });
});
