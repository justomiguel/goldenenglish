export {
  SEED_STUDENT_BADGE_CODES,
  type SeedStudentBadgeCode,
  type StudentBadgeCode,
  isSeedStudentBadgeCode,
  isStudentBadgeCode,
} from "@/lib/badges/badgeCodes";
export {
  BADGE_CATEGORIES,
  BADGE_CRITERIA_TYPES,
  BADGE_LOCALES,
  type BadgeCategory,
  type BadgeCatalogEntry,
  type BadgeCriteriaType,
  type BadgeLocale,
  type BadgeTranslation,
  isBadgeCategory,
  isBadgeCriteriaType,
  isBadgeLocale,
  resolveBadgeTranslation,
} from "@/lib/badges/badgeCatalog";
export {
  loadActiveBadgeCatalog,
  loadFullBadgeCatalog,
  loadBadgeCatalogEntryById,
} from "@/lib/badges/loadBadgeCatalog";
export {
  loadPublicBadgeCatalogEntryByCode,
  type PublicBadgeCatalogEntry,
} from "@/lib/badges/loadPublicBadgeCatalogEntry";
export { badgeImagePublicUrl } from "@/lib/badges/badgeImagePublicUrl";
export { studentBadgeCategory, type StudentBadgeCategory } from "@/lib/badges/badgeCategory";
export {
  computeEligibleBadgesFromCatalog,
  isBadgeEntryEligible,
  type StudentBadgeEvaluationContext,
} from "@/lib/badges/evaluateBadgeCatalogEligibility";
export { awardStudentBadges, type AwardStudentBadgesInput } from "@/lib/badges/awardStudentBadges";
export { awardStudentBadgesForEnrollments } from "@/lib/badges/awardStudentBadgesForEnrollments";
export {
  loadPublicStudentBadgeShareByToken,
  type PublicStudentBadgeShare,
} from "@/lib/badges/loadPublicStudentBadgeShare";
