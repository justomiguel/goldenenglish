import { describe, expect, it } from "vitest";
import {
  cohortMatchesCalendarYear,
  findCohortForCalendarYear,
  type CohortYearCandidate,
} from "@/lib/admin-tutorials/findCohortForCalendarYear";

const base = (overrides: Partial<CohortYearCandidate>): CohortYearCandidate => ({
  id: "a",
  name: "Cohort",
  slug: null,
  starts_on: null,
  ends_on: null,
  archived_at: null,
  ...overrides,
});

describe("cohortMatchesCalendarYear", () => {
  it("matches year in name", () => {
    expect(cohortMatchesCalendarYear(base({ name: "Cohort 2026" }), 2026)).toBe(true);
  });

  it("matches year in slug", () => {
    expect(cohortMatchesCalendarYear(base({ slug: "cohort-2026" }), 2026)).toBe(true);
  });

  it("matches year in starts_on", () => {
    expect(cohortMatchesCalendarYear(base({ starts_on: "2026-03-01" }), 2026)).toBe(true);
  });

  it("ignores archived cohorts", () => {
    expect(
      cohortMatchesCalendarYear(base({ name: "2026", archived_at: "2026-01-01" }), 2026),
    ).toBe(false);
  });
});

describe("findCohortForCalendarYear", () => {
  it("returns null when no match", () => {
    expect(findCohortForCalendarYear([base({ name: "2025" })], 2026)).toBeNull();
  });

  it("prefers is_current among matches", () => {
    const older = base({ id: "1", name: "2026 A", is_current: false });
    const current = base({ id: "2", name: "2026 B", is_current: true });
    expect(findCohortForCalendarYear([older, current], 2026)?.id).toBe("2");
  });
});
