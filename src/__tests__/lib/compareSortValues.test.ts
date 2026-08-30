import { describe, expect, it } from "vitest";
import { compareSortValues } from "@/lib/sort/compareSortValues";

describe("compareSortValues", () => {
  it("sorts numbers and keeps empty values last", () => {
    expect(compareSortValues(2, 10, "asc")).toBeLessThan(0);
    expect(compareSortValues(null, 1, "asc")).toBeGreaterThan(0);
    expect(compareSortValues("", "a", "asc")).toBeGreaterThan(0);
  });

  it("sorts text with numeric awareness", () => {
    expect(compareSortValues("A2", "A10", "asc")).toBeLessThan(0);
    expect(compareSortValues("zeta", "alfa", "desc")).toBeLessThan(0);
  });
});
