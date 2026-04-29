import { maxConsecutiveCalendarDayStreak } from "@/lib/badges/attendanceStreak";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";

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
  /** Lifetime count of messages this student authored from the portal inbox. */
  messagesSentCount: number;
};

function isNonEmptyTrimmed(s: string | null | undefined): boolean {
  return Boolean(s && String(s).trim().length > 0);
}

function profileCompletenessScore(profile: StudentBadgeEvaluationContext["profile"]): number {
  return [
    isNonEmptyTrimmed(profile.phone),
    profile.birth_date != null && String(profile.birth_date).trim().length > 0,
    isNonEmptyTrimmed(profile.avatar_url),
  ].filter(Boolean).length;
}

const PROFILE_COMPLETE_REQUIRED_FIELDS = 3;

/**
 * Evaluates whether a single catalog entry is satisfied by `ctx`.
 * The criteria DSL is intentionally bounded — see ADR 2026-04-student-badges-admin-catalog.md.
 */
export function isBadgeEntryEligible(
  entry: Pick<BadgeCatalogEntry, "criteriaType" | "criteriaThreshold">,
  ctx: StudentBadgeEvaluationContext,
): boolean {
  const threshold = Math.max(0, Math.floor(entry.criteriaThreshold));
  switch (entry.criteriaType) {
    case "tasks_completed":
      return ctx.completedTaskCount >= threshold;
    case "attendance_streak":
      return maxConsecutiveCalendarDayStreak(ctx.goodAttendanceDatesSorted) >= threshold;
    case "attendance_days_total":
      return ctx.goodAttendanceDatesSorted.length >= threshold;
    case "profile_complete":
      // Threshold here means "all configured profile fields present" — keep semantic constant.
      return profileCompletenessScore(ctx.profile) >= PROFILE_COMPLETE_REQUIRED_FIELDS;
    case "profile_avatar_set":
      return isNonEmptyTrimmed(ctx.profile.avatar_url);
    case "profile_phone_set":
      return isNonEmptyTrimmed(ctx.profile.phone);
    case "profile_birth_date_set":
      return ctx.profile.birth_date != null && String(ctx.profile.birth_date).trim().length > 0;
    case "assessments_passed":
      return ctx.passedAssessmentCount >= threshold;
    case "messages_sent":
      return ctx.messagesSentCount >= threshold;
    default:
      return false;
  }
}

/**
 * Returns the catalog entries the student qualifies for (preserves catalog order).
 */
export function computeEligibleBadgesFromCatalog(
  ctx: StudentBadgeEvaluationContext,
  catalog: ReadonlyArray<BadgeCatalogEntry>,
): BadgeCatalogEntry[] {
  return catalog.filter((entry) => entry.isActive && isBadgeEntryEligible(entry, ctx));
}
