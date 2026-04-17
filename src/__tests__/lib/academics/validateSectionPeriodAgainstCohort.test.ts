import { describe, expect, it } from "vitest";
import { validateSectionPeriodAgainstCohort } from "@/lib/academics/validateSectionPeriodAgainstCohort";

describe("validateSectionPeriodAgainstCohort", () => {
  it("accepts ordered dates", () => {
    expect(
      validateSectionPeriodAgainstCohort({
        sectionStartsOn: "2026-03-01",
        sectionEndsOn: "2026-06-30",
        cohortStartsOn: null,
        cohortEndsOn: null,
      }),
    ).toEqual({ ok: true });
  });

  it("rejects when start is after end", () => {
    expect(
      validateSectionPeriodAgainstCohort({
        sectionStartsOn: "2026-06-30",
        sectionEndsOn: "2026-03-01",
        cohortStartsOn: null,
        cohortEndsOn: null,
      }),
    ).toEqual({ ok: false, code: "ORDER" });
  });

  it("ignores cohort bounds (section period is independent)", () => {
    expect(
      validateSectionPeriodAgainstCohort({
        sectionStartsOn: "2025-12-01",
        sectionEndsOn: "2026-06-30",
        cohortStartsOn: "2026-01-01",
        cohortEndsOn: "2026-12-31",
      }),
    ).toEqual({ ok: true });
  });

  it("ignores cohort end when section extends past it", () => {
    expect(
      validateSectionPeriodAgainstCohort({
        sectionStartsOn: "2026-03-01",
        sectionEndsOn: "2027-01-05",
        cohortStartsOn: "2026-01-01",
        cohortEndsOn: "2026-12-31",
      }),
    ).toEqual({ ok: true });
  });
});
