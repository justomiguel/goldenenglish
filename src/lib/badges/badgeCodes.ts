/** Stable badge identifiers (migrations, grants, i18n keys, analytics). */
export const BADGE_TASKS_1 = "tasks_completed_1" as const;
export const BADGE_TASKS_5 = "tasks_completed_5" as const;
export const BADGE_TASKS_10 = "tasks_completed_10" as const;
export const BADGE_ATTENDANCE_STREAK_5 = "attendance_streak_5" as const;
export const BADGE_PROFILE_COMPLETE = "profile_complete" as const;
export const BADGE_FIRST_ASSESSMENT_PASSED = "first_assessment_passed" as const;

export const ALL_STUDENT_BADGE_CODES = [
  BADGE_TASKS_1,
  BADGE_TASKS_5,
  BADGE_TASKS_10,
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_PROFILE_COMPLETE,
  BADGE_FIRST_ASSESSMENT_PASSED,
] as const;

export type StudentBadgeCode = (typeof ALL_STUDENT_BADGE_CODES)[number];

export function isStudentBadgeCode(s: string): s is StudentBadgeCode {
  return (ALL_STUDENT_BADGE_CODES as readonly string[]).includes(s);
}
