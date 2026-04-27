import {
  ALL_STUDENT_BADGE_CODES,
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_FIRST_ASSESSMENT_PASSED,
  BADGE_PROFILE_COMPLETE,
  BADGE_TASKS_1,
  BADGE_TASKS_10,
  BADGE_TASKS_5,
  type StudentBadgeCode,
} from "@/lib/badges/badgeCodes";
import { maxConsecutiveCalendarDayStreak } from "@/lib/badges/attendanceStreak";

export type StudentBadgeEvaluationContext = {
  completedTaskCount: number;
  /** ISO YYYY-MM-DD, sorted ascending, unique, days with at least one good attendance. */
  goodAttendanceDatesSorted: string[];
  profile: {
    phone: string | null;
    birth_date: string | null;
    avatar_url: string | null;
  };
  passedAssessmentCount: number;
};

function isNonEmptyTrimmed(s: string | null | undefined): boolean {
  return Boolean(s && String(s).trim().length > 0);
}

export function computeEligibleStudentBadgeCodes(ctx: StudentBadgeEvaluationContext): StudentBadgeCode[] {
  const hit = new Set<StudentBadgeCode>();
  const n = ctx.completedTaskCount;
  if (n >= 1) hit.add(BADGE_TASKS_1);
  if (n >= 5) hit.add(BADGE_TASKS_5);
  if (n >= 10) hit.add(BADGE_TASKS_10);

  const streak = maxConsecutiveCalendarDayStreak(ctx.goodAttendanceDatesSorted);
  if (streak >= 5) hit.add(BADGE_ATTENDANCE_STREAK_5);

  const p = ctx.profile;
  if (
    isNonEmptyTrimmed(p.phone) &&
    p.birth_date != null &&
    String(p.birth_date).trim().length > 0 &&
    isNonEmptyTrimmed(p.avatar_url)
  ) {
    hit.add(BADGE_PROFILE_COMPLETE);
  }

  if (ctx.passedAssessmentCount >= 1) {
    hit.add(BADGE_FIRST_ASSESSMENT_PASSED);
  }

  return ALL_STUDENT_BADGE_CODES.filter((c) => hit.has(c));
}
