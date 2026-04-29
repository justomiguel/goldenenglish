/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  computeEligibleBadgesFromCatalog,
  isBadgeEntryEligible,
  type StudentBadgeEvaluationContext,
} from "@/lib/badges/evaluateBadgeCatalogEligibility";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";

function entry(over: Partial<BadgeCatalogEntry>): BadgeCatalogEntry {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    code: "test",
    category: "tasks",
    criteriaType: "tasks_completed",
    criteriaThreshold: 1,
    imagePath: null,
    isActive: true,
    sortOrder: 100,
    translations: {},
    ...over,
  };
}

const baseCtx: StudentBadgeEvaluationContext = {
  completedTaskCount: 0,
  goodAttendanceDatesSorted: [],
  profile: { phone: null, birth_date: null, avatar_url: null },
  passedAssessmentCount: 0,
  messagesSentCount: 0,
};

describe("isBadgeEntryEligible", () => {
  describe("tasks_completed", () => {
    it("requires count to reach threshold", () => {
      const e = entry({ criteriaType: "tasks_completed", criteriaThreshold: 5 });
      expect(isBadgeEntryEligible(e, { ...baseCtx, completedTaskCount: 4 })).toBe(false);
      expect(isBadgeEntryEligible(e, { ...baseCtx, completedTaskCount: 5 })).toBe(true);
      expect(isBadgeEntryEligible(e, { ...baseCtx, completedTaskCount: 100 })).toBe(true);
    });

    it("treats threshold 0 as always eligible (admin smoke badge)", () => {
      const e = entry({ criteriaType: "tasks_completed", criteriaThreshold: 0 });
      expect(isBadgeEntryEligible(e, baseCtx)).toBe(true);
    });
  });

  describe("attendance_streak", () => {
    it("compares longest calendar streak vs threshold", () => {
      const e = entry({ criteriaType: "attendance_streak", criteriaThreshold: 3 });
      const consecutive = ["2026-04-01", "2026-04-02", "2026-04-03"];
      const interrupted = ["2026-04-01", "2026-04-02", "2026-04-04"];
      expect(isBadgeEntryEligible(e, { ...baseCtx, goodAttendanceDatesSorted: consecutive })).toBe(true);
      expect(
        isBadgeEntryEligible(e, { ...baseCtx, goodAttendanceDatesSorted: interrupted }),
      ).toBe(false);
    });
  });

  describe("profile_complete", () => {
    it("requires phone, birth_date and avatar_url all filled", () => {
      const e = entry({ criteriaType: "profile_complete", criteriaThreshold: 1 });
      const partial: StudentBadgeEvaluationContext = {
        ...baseCtx,
        profile: { phone: "+11", birth_date: "1990-01-01", avatar_url: null },
      };
      const full: StudentBadgeEvaluationContext = {
        ...baseCtx,
        profile: { phone: "+11", birth_date: "1990-01-01", avatar_url: "u/1.png" },
      };
      const blank: StudentBadgeEvaluationContext = {
        ...baseCtx,
        profile: { phone: "   ", birth_date: "  ", avatar_url: "   " },
      };
      expect(isBadgeEntryEligible(e, partial)).toBe(false);
      expect(isBadgeEntryEligible(e, full)).toBe(true);
      expect(isBadgeEntryEligible(e, blank)).toBe(false);
    });
  });

  describe("assessments_passed", () => {
    it("compares passed count vs threshold", () => {
      const e = entry({ criteriaType: "assessments_passed", criteriaThreshold: 2 });
      expect(isBadgeEntryEligible(e, { ...baseCtx, passedAssessmentCount: 1 })).toBe(false);
      expect(isBadgeEntryEligible(e, { ...baseCtx, passedAssessmentCount: 2 })).toBe(true);
    });
  });

  describe("attendance_days_total", () => {
    it("counts total distinct calendar days regardless of streak gaps", () => {
      const e = entry({ criteriaType: "attendance_days_total", criteriaThreshold: 3 });
      const interrupted = ["2026-04-01", "2026-04-02", "2026-04-04"];
      expect(isBadgeEntryEligible(e, { ...baseCtx, goodAttendanceDatesSorted: interrupted })).toBe(true);
      const tooFew = ["2026-04-01", "2026-04-02"];
      expect(isBadgeEntryEligible(e, { ...baseCtx, goodAttendanceDatesSorted: tooFew })).toBe(false);
    });
  });

  describe("profile_avatar_set", () => {
    it("requires a non-empty avatar_url", () => {
      const e = entry({ criteriaType: "profile_avatar_set" });
      const without = { ...baseCtx, profile: { phone: null, birth_date: null, avatar_url: null } };
      const blank = { ...baseCtx, profile: { phone: null, birth_date: null, avatar_url: "   " } };
      const set = { ...baseCtx, profile: { phone: null, birth_date: null, avatar_url: "u/1.png" } };
      expect(isBadgeEntryEligible(e, without)).toBe(false);
      expect(isBadgeEntryEligible(e, blank)).toBe(false);
      expect(isBadgeEntryEligible(e, set)).toBe(true);
    });
  });

  describe("profile_phone_set", () => {
    it("requires a non-empty phone", () => {
      const e = entry({ criteriaType: "profile_phone_set" });
      const set = { ...baseCtx, profile: { phone: "+5491100000000", birth_date: null, avatar_url: null } };
      expect(isBadgeEntryEligible(e, baseCtx)).toBe(false);
      expect(isBadgeEntryEligible(e, set)).toBe(true);
    });
  });

  describe("profile_birth_date_set", () => {
    it("requires a non-empty birth_date", () => {
      const e = entry({ criteriaType: "profile_birth_date_set" });
      const set = { ...baseCtx, profile: { phone: null, birth_date: "1990-01-01", avatar_url: null } };
      expect(isBadgeEntryEligible(e, baseCtx)).toBe(false);
      expect(isBadgeEntryEligible(e, set)).toBe(true);
    });
  });

  describe("messages_sent", () => {
    it("compares lifetime messages sent vs threshold", () => {
      const e = entry({ criteriaType: "messages_sent", criteriaThreshold: 5 });
      expect(isBadgeEntryEligible(e, { ...baseCtx, messagesSentCount: 4 })).toBe(false);
      expect(isBadgeEntryEligible(e, { ...baseCtx, messagesSentCount: 5 })).toBe(true);
      expect(isBadgeEntryEligible(e, { ...baseCtx, messagesSentCount: 50 })).toBe(true);
    });
  });
});

describe("computeEligibleBadgesFromCatalog", () => {
  it("filters out paused entries", () => {
    const catalog = [
      entry({ id: "a", code: "a", isActive: true, criteriaThreshold: 1 }),
      entry({ id: "b", code: "b", isActive: false, criteriaThreshold: 1 }),
    ];
    const ctx = { ...baseCtx, completedTaskCount: 5 };
    const out = computeEligibleBadgesFromCatalog(ctx, catalog).map((e) => e.code);
    expect(out).toEqual(["a"]);
  });

  it("preserves catalog order (sort_order is the input contract)", () => {
    const catalog = [
      entry({ id: "a", code: "a_late", criteriaThreshold: 1, sortOrder: 50 }),
      entry({ id: "b", code: "b_early", criteriaThreshold: 1, sortOrder: 10 }),
    ];
    const ctx = { ...baseCtx, completedTaskCount: 5 };
    // The loader is the one that sorts; the evaluator must not reorder.
    const out = computeEligibleBadgesFromCatalog(ctx, catalog).map((e) => e.code);
    expect(out).toEqual(["a_late", "b_early"]);
  });

  it("evaluates mixed criteria types in one pass", () => {
    const catalog = [
      entry({ id: "1", code: "task1", criteriaType: "tasks_completed", criteriaThreshold: 1 }),
      entry({
        id: "2",
        code: "streak3",
        criteriaType: "attendance_streak",
        criteriaThreshold: 3,
      }),
      entry({
        id: "3",
        code: "profile",
        criteriaType: "profile_complete",
        criteriaThreshold: 1,
      }),
    ];
    const out = computeEligibleBadgesFromCatalog(
      {
        completedTaskCount: 1,
        goodAttendanceDatesSorted: ["2026-01-01", "2026-01-02"],
        profile: { phone: "+11", birth_date: "1990-01-01", avatar_url: "p.png" },
        passedAssessmentCount: 0,
        messagesSentCount: 0,
      },
      catalog,
    ).map((e) => e.code);
    expect(out).toEqual(["task1", "profile"]);
  });
});
