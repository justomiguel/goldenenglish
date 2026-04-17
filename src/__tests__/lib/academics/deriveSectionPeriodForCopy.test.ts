import { describe, expect, it } from "vitest";
import { deriveSectionPeriodForCopy } from "@/lib/academics/deriveSectionPeriodForCopy";

describe("deriveSectionPeriodForCopy", () => {
  it("reuses source section dates when valid", () => {
    expect(
      deriveSectionPeriodForCopy({
        sourceStartsOn: "2026-02-01",
        sourceEndsOn: "2026-05-01",
      }),
    ).toEqual({ starts_on: "2026-02-01", ends_on: "2026-05-01" });
  });

  it("falls back to today when source order is invalid", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(
      deriveSectionPeriodForCopy({
        sourceStartsOn: "2026-06-01",
        sourceEndsOn: "2026-01-01",
      }),
    ).toEqual({ starts_on: today, ends_on: today });
  });
});
