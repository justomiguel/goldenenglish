import {
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_FIRST_ASSESSMENT_PASSED,
  BADGE_PROFILE_COMPLETE,
  BADGE_TASKS_1,
  BADGE_TASKS_10,
  BADGE_TASKS_5,
  isSeedStudentBadgeCode,
} from "@/lib/badges/badgeCodes";
import type { BadgeCategory } from "@/lib/badges/badgeCatalog";

/** Re-export for legacy consumers; prefer `BadgeCategory` directly. */
export type StudentBadgeCategory = BadgeCategory;

const SEED_CATEGORY_MAP: Record<string, BadgeCategory> = {
  [BADGE_TASKS_1]: "tasks",
  [BADGE_TASKS_5]: "tasks",
  [BADGE_TASKS_10]: "tasks",
  [BADGE_ATTENDANCE_STREAK_5]: "attendance",
  [BADGE_PROFILE_COMPLETE]: "profile",
  [BADGE_FIRST_ASSESSMENT_PASSED]: "learning",
};

/**
 * Fallback resolver for legacy callers without a catalog row at hand.
 * For catalog-driven badges, prefer the `category` column straight from the
 * loaded `BadgeCatalogEntry`.
 */
export function studentBadgeCategory(code: string): BadgeCategory {
  if (isSeedStudentBadgeCode(code)) return SEED_CATEGORY_MAP[code]!;
  return "learning";
}
