import { describe, it, expect } from "vitest";
import { computeBadgeEntryProgress } from "@/lib/badges/computeBadgeEntryProgress";
import type { StudentBadgeEvaluationContext } from "@/lib/badges/evaluateBadgeCatalogEligibility";

const baseCtx: StudentBadgeEvaluationContext = {
  completedTaskCount: 0,
  goodAttendanceDatesSorted: [],
  profile: { phone: null, birth_date: null, avatar_url: null },
  passedAssessmentCount: 0,
  messagesSentCount: 0,
};

describe("computeBadgeEntryProgress", () => {
  it("returns fractional progress for task badges", () => {
    const p = computeBadgeEntryProgress(
      { criteriaType: "tasks_completed", criteriaThreshold: 10 },
      { ...baseCtx, completedTaskCount: 3 },
    );
    expect(p.current).toBe(3);
    expect(p.target).toBe(10);
    expect(p.percent).toBe(30);
    expect(p.eligible).toBe(false);
  });

  it("uses three fields for profile_complete", () => {
    const p = computeBadgeEntryProgress(
      { criteriaType: "profile_complete", criteriaThreshold: 1 },
      {
        ...baseCtx,
        profile: { phone: "+1", birth_date: "1990-01-01", avatar_url: null },
      },
    );
    expect(p.current).toBe(2);
    expect(p.target).toBe(3);
    expect(p.percent).toBe(67);
  });
});
