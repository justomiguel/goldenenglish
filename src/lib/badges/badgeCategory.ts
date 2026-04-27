import {
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_FIRST_ASSESSMENT_PASSED,
  BADGE_PROFILE_COMPLETE,
  BADGE_TASKS_1,
  BADGE_TASKS_10,
  BADGE_TASKS_5,
  type StudentBadgeCode,
} from "@/lib/badges/badgeCodes";

export type StudentBadgeCategory = "tasks" | "attendance" | "profile" | "learning";

const MAP: Record<StudentBadgeCode, StudentBadgeCategory> = {
  [BADGE_TASKS_1]: "tasks",
  [BADGE_TASKS_5]: "tasks",
  [BADGE_TASKS_10]: "tasks",
  [BADGE_ATTENDANCE_STREAK_5]: "attendance",
  [BADGE_PROFILE_COMPLETE]: "profile",
  [BADGE_FIRST_ASSESSMENT_PASSED]: "learning",
};

export function studentBadgeCategory(code: StudentBadgeCode): StudentBadgeCategory {
  return MAP[code];
}
