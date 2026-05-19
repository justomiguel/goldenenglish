import { describe, it, expect } from "vitest";
import { buildStudentBadgeDisplayRows } from "@/lib/badges/buildStudentBadgeDisplayRows";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";
import type { StudentBadgeEvaluationContext } from "@/lib/badges/evaluateBadgeCatalogEligibility";

function entry(code: string, over: Partial<BadgeCatalogEntry> = {}): BadgeCatalogEntry {
  return {
    id: `id-${code}`,
    code,
    category: "tasks",
    criteriaType: "tasks_completed",
    criteriaThreshold: 5,
    imagePath: null,
    isActive: true,
    sortOrder: 10,
    translations: { en: { title: code, description: "" } },
    ...over,
  };
}

const ctx: StudentBadgeEvaluationContext = {
  completedTaskCount: 2,
  goodAttendanceDatesSorted: [],
  profile: { phone: null, birth_date: null, avatar_url: null },
  passedAssessmentCount: 0,
  messagesSentCount: 0,
};

describe("buildStudentBadgeDisplayRows", () => {
  it("includes locked catalog rows with progress when not granted", () => {
    const rows = buildStudentBadgeDisplayRows({
      catalog: [entry("tasks_completed_5")],
      grants: [],
      ctx,
      shareUrlForToken: () => "https://example.com/b/x",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.locked).toBe(true);
    expect(rows[0]?.progress?.current).toBe(2);
    expect(rows[0]?.progress?.target).toBe(5);
  });

  it("marks granted badges as unlocked", () => {
    const rows = buildStudentBadgeDisplayRows({
      catalog: [entry("tasks_completed_5")],
      grants: [
        {
          id: "g1",
          badge_code: "tasks_completed_5",
          earned_at: "2026-01-01",
          public_share_token: "tok",
        },
      ],
      ctx,
      shareUrlForToken: () => "https://example.com/b/tok",
    });
    expect(rows[0]?.locked).toBe(false);
    expect(rows[0]?.earnedAt).toBe("2026-01-01");
  });

  it("sorts earned first, then locked by descending progress", () => {
    const rows = buildStudentBadgeDisplayRows({
      catalog: [
        entry("low", { criteriaThreshold: 10, sortOrder: 30 }),
        entry("high", { criteriaThreshold: 5, sortOrder: 20 }),
        entry("done", { criteriaThreshold: 1, sortOrder: 10 }),
      ],
      grants: [
        {
          id: "g1",
          badge_code: "done",
          earned_at: "2026-02-01",
          public_share_token: "t1",
        },
      ],
      ctx: { ...ctx, completedTaskCount: 2 },
      shareUrlForToken: () => "https://example.com/b/x",
    });
    expect(rows.map((r) => r.badgeCode)).toEqual(["done", "high", "low"]);
    expect(rows[0]?.locked).toBe(false);
    expect(rows[1]?.progress?.percent).toBe(40);
    expect(rows[2]?.progress?.percent).toBe(20);
  });
});
