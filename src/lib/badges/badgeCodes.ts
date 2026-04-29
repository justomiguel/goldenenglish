/**
 * Badge codes are now an admin-managed catalog (see ADR
 * `2026-04-student-badges-admin-catalog.md`). The constants below are kept as
 * stable identifiers for the six seed badges that the migration installs by
 * default — they are useful for tests and for falling back to dictionary copy
 * when the catalog row or its translation is missing for the active locale.
 *
 * Treat any newly-created admin badge code as a generic non-empty string;
 * runtime validation of "shape only" lives in `isStudentBadgeCode`.
 */
export const BADGE_TASKS_1 = "tasks_completed_1" as const;
export const BADGE_TASKS_5 = "tasks_completed_5" as const;
export const BADGE_TASKS_10 = "tasks_completed_10" as const;
export const BADGE_ATTENDANCE_STREAK_5 = "attendance_streak_5" as const;
export const BADGE_PROFILE_COMPLETE = "profile_complete" as const;
export const BADGE_FIRST_ASSESSMENT_PASSED = "first_assessment_passed" as const;

export const SEED_STUDENT_BADGE_CODES = [
  BADGE_TASKS_1,
  BADGE_TASKS_5,
  BADGE_TASKS_10,
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_PROFILE_COMPLETE,
  BADGE_FIRST_ASSESSMENT_PASSED,
] as const;

export type SeedStudentBadgeCode = (typeof SEED_STUDENT_BADGE_CODES)[number];

/** Generic string type for runtime catalog codes. Use `SeedStudentBadgeCode` for the seed union. */
export type StudentBadgeCode = string;

const BADGE_CODE_PATTERN = /^[a-z0-9_]{1,64}$/;

/** Shape-only validation; matches the SQL CHECK on `badge_catalog.code`. */
export function isStudentBadgeCode(s: unknown): s is StudentBadgeCode {
  return typeof s === "string" && BADGE_CODE_PATTERN.test(s);
}

/** True when `code` is one of the six seed badges installed by the migration. */
export function isSeedStudentBadgeCode(s: unknown): s is SeedStudentBadgeCode {
  return typeof s === "string" && (SEED_STUDENT_BADGE_CODES as readonly string[]).includes(s);
}
