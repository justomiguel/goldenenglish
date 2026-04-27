// REGRESSION CHECK: New badge rules must be backwards-compatible for grant IDs and i18n keys.
import { computeEligibleStudentBadgeCodes } from "@/lib/badges/badgeEligibility";
import {
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_FIRST_ASSESSMENT_PASSED,
  BADGE_PROFILE_COMPLETE,
  BADGE_TASKS_1,
  BADGE_TASKS_10,
  BADGE_TASKS_5,
} from "@/lib/badges/badgeCodes";
import { describe, expect, it } from "vitest";

describe("computeEligibleStudentBadgeCodes", () => {
  const emptyProfile = { phone: null, birth_date: null, avatar_url: null };
  it("emits only task1 when one completed and nothing else", () => {
    expect(
      computeEligibleStudentBadgeCodes({
        completedTaskCount: 1,
        goodAttendanceDatesSorted: [],
        profile: emptyProfile,
        passedAssessmentCount: 0,
      }),
    ).toEqual([BADGE_TASKS_1]);
  });
  it("emits all task tiers", () => {
    const codes = computeEligibleStudentBadgeCodes({
        completedTaskCount: 10,
        goodAttendanceDatesSorted: [],
        profile: emptyProfile,
        passedAssessmentCount: 0,
      });
    expect(codes).toEqual(expect.arrayContaining([BADGE_TASKS_1, BADGE_TASKS_5, BADGE_TASKS_10]));
  });
  it("streak5 when five consecutive good days", () => {
    const run = ["2026-01-10", "2026-01-11", "2026-01-12", "2026-01-13", "2026-01-14"];
    expect(
      computeEligibleStudentBadgeCodes({
        completedTaskCount: 0,
        goodAttendanceDatesSorted: run,
        profile: emptyProfile,
        passedAssessmentCount: 0,
      }),
    ).toContain(BADGE_ATTENDANCE_STREAK_5);
  });
  it("profile_complete when required fields are present", () => {
    expect(
      computeEligibleStudentBadgeCodes({
        completedTaskCount: 0,
        goodAttendanceDatesSorted: [],
        profile: { phone: "+1", birth_date: "2010-01-01", avatar_url: "avatars/uid/p.jpg" },
        passedAssessmentCount: 0,
      }),
    ).toContain(BADGE_PROFILE_COMPLETE);
  });
  it("first pass when an assessment is passed at least once", () => {
    expect(
      computeEligibleStudentBadgeCodes({
        completedTaskCount: 0,
        goodAttendanceDatesSorted: [],
        profile: emptyProfile,
        passedAssessmentCount: 1,
      }),
    ).toContain(BADGE_FIRST_ASSESSMENT_PASSED);
  });
});
