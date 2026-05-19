import { maxConsecutiveCalendarDayStreak } from "@/lib/badges/attendanceStreak";
import type { BadgeCatalogEntry } from "@/lib/badges/badgeCatalog";
import type { StudentBadgeEvaluationContext } from "@/lib/badges/evaluateBadgeCatalogEligibility";
import { isBadgeEntryEligible } from "@/lib/badges/evaluateBadgeCatalogEligibility";

export type BadgeEntryProgress = {
  current: number;
  target: number;
  percent: number;
  eligible: boolean;
};

const PROFILE_COMPLETE_FIELDS = 3;

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

function toPercent(current: number, target: number): number {
  if (target <= 0) return current > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

/**
 * Progress toward a catalog badge for UI (locked cards). Mirrors eligibility rules.
 */
export function computeBadgeEntryProgress(
  entry: Pick<BadgeCatalogEntry, "criteriaType" | "criteriaThreshold">,
  ctx: StudentBadgeEvaluationContext,
): BadgeEntryProgress {
  const target = Math.max(0, Math.floor(entry.criteriaThreshold));
  let current = 0;

  switch (entry.criteriaType) {
    case "tasks_completed":
      current = ctx.completedTaskCount;
      break;
    case "attendance_streak":
      current = maxConsecutiveCalendarDayStreak(ctx.goodAttendanceDatesSorted);
      break;
    case "attendance_days_total":
      current = ctx.goodAttendanceDatesSorted.length;
      break;
    case "profile_complete":
      current = profileCompletenessScore(ctx.profile);
      return {
        current,
        target: PROFILE_COMPLETE_FIELDS,
        percent: toPercent(current, PROFILE_COMPLETE_FIELDS),
        eligible: isBadgeEntryEligible(entry, ctx),
      };
    case "profile_avatar_set":
      current = isNonEmptyTrimmed(ctx.profile.avatar_url) ? 1 : 0;
      return {
        current,
        target: 1,
        percent: current * 100,
        eligible: isBadgeEntryEligible(entry, ctx),
      };
    case "profile_phone_set":
      current = isNonEmptyTrimmed(ctx.profile.phone) ? 1 : 0;
      return {
        current,
        target: 1,
        percent: current * 100,
        eligible: isBadgeEntryEligible(entry, ctx),
      };
    case "profile_birth_date_set":
      current =
        ctx.profile.birth_date != null && String(ctx.profile.birth_date).trim().length > 0 ? 1 : 0;
      return {
        current,
        target: 1,
        percent: current * 100,
        eligible: isBadgeEntryEligible(entry, ctx),
      };
    case "assessments_passed":
      current = ctx.passedAssessmentCount;
      break;
    case "messages_sent":
      current = ctx.messagesSentCount;
      break;
    default:
      return { current: 0, target: 1, percent: 0, eligible: false };
  }

  return {
    current,
    target,
    percent: toPercent(current, target),
    eligible: isBadgeEntryEligible(entry, ctx),
  };
}
