// Test group 1 — the progress pillar
// Spec 7, Test 1: buildParentHomePillarSnapshot gains a progress pillar.
// - Returns the last published grade for the selected child.
// - A child with no published grade yields "unknown" level (neutral, not alarming).
// - The existing three pillars are structurally unchanged.
import { describe, it, expect } from "vitest";
import {
  buildParentHomePillarSnapshot,
  type ParentChildLastGrade,
} from "@/lib/parent/buildParentHomePillarSnapshot";

const GRADE: ParentChildLastGrade = {
  score: 18,
  maxScore: 20,
  assessmentName: "Mid-term",
  assessmentOn: "2026-07-15",
};

describe("buildParentHomePillarSnapshot — progress pillar", () => {
  it("returns a progress pillar when lastPublishedGrade is provided", () => {
    const snap = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
      lastPublishedGrade: GRADE,
    });
    expect(snap.progress).toBeDefined();
    expect(snap.progress.lastPublishedGrade).toEqual(GRADE);
    expect(snap.progress.level).toBe("ok");
  });

  it("yields 'unknown' level (neutral) when no grade has been published", () => {
    const snap = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
      lastPublishedGrade: null,
    });
    expect(snap.progress.level).toBe("unknown");
    expect(snap.progress.lastPublishedGrade).toBeNull();
  });

  it("omitted lastPublishedGrade also yields 'unknown' level", () => {
    const snap = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 80 },
      overdueByStudent: { s1: false },
      staffInboundCount: 0,
      overdueInvoiceCount: 0,
    });
    expect(snap.progress.level).toBe("unknown");
    expect(snap.progress.lastPublishedGrade).toBeNull();
  });

  it("the three existing pillars are structurally unchanged when grade is added", () => {
    const snap = buildParentHomePillarSnapshot({
      selectedStudentId: "s1",
      attendanceByStudent: { s1: 60 },
      attendanceMinPercent: 75,
      overdueByStudent: { s1: true },
      staffInboundCount: 2,
      overdueInvoiceCount: 1,
      lastPublishedGrade: GRADE,
    });
    expect(snap.attendance.level).toBe("attention");
    expect(snap.messages.level).toBe("attention");
    expect(snap.payments.level).toBe("attention");
    expect(snap.attendance).toHaveProperty("monthPercent");
    expect(snap.messages).toHaveProperty("staffInboundCount");
    expect(snap.payments).toHaveProperty("hasOverdueMonthly");
    expect(snap.payments).toHaveProperty("overdueInvoiceCount");
  });
});
