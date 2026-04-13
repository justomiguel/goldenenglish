import { describe, it, expect } from "vitest";
import { allocateUniqueSectionName } from "@/lib/academics/uniqueSectionNameInCohort";

describe("allocateUniqueSectionName", () => {
  it("uses base name when free", () => {
    const taken = new Set<string>();
    expect(allocateUniqueSectionName("Monday A", taken)).toBe("Monday A");
    expect(taken.has("Monday A")).toBe(true);
  });

  it("adds numeric suffix when name is taken", () => {
    const taken = new Set(["A", "A (2)"]);
    expect(allocateUniqueSectionName("A", taken)).toBe("A (3)");
  });

  it("handles empty base", () => {
    const taken = new Set<string>();
    expect(allocateUniqueSectionName("  ", taken)).toBe("Section");
  });
});
