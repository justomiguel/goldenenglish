import { describe, expect, it } from "vitest";
import { resolveTargetCohortForSectionTour } from "@/lib/admin-tutorials/resolveTargetCohortForSectionTour";
import type { CohortYearCandidate } from "@/lib/admin-tutorials/findCohortForCalendarYear";

function base(overrides: Partial<CohortYearCandidate>): CohortYearCandidate {
  return {
    id: "id",
    name: "Cohort",
    slug: null,
    starts_on: null,
    ends_on: null,
    archived_at: null,
    ...overrides,
  };
}

describe("resolveTargetCohortForSectionTour", () => {
  it("prefers is_current over year match", () => {
    const current = base({ id: "cur", name: "2025", is_current: true });
    const yearMatch = base({ id: "y", name: "Cohort 2026" });
    expect(resolveTargetCohortForSectionTour([yearMatch, current], 2026)?.id).toBe("cur");
  });

  it("falls back to calendar year match when no current", () => {
    const match = base({ id: "y", name: "Cohort 2026" });
    expect(resolveTargetCohortForSectionTour([match], 2026)?.id).toBe("y");
  });

  it("returns null when no active cohort fits", () => {
    const archived = base({ id: "a", name: "2026", archived_at: "2026-01-01" });
    expect(resolveTargetCohortForSectionTour([archived], 2026)).toBeNull();
  });
});
