/**
 * Bounded enums mirror the Postgres types in 082_student_badges_catalog.sql,
 * extended in 086_student_badges_extra_criteria_types.sql.
 */
export const BADGE_CATEGORIES = [
  "tasks",
  "attendance",
  "profile",
  "learning",
  "community",
] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

export const BADGE_CRITERIA_TYPES = [
  "tasks_completed",
  "attendance_streak",
  "attendance_days_total",
  "profile_complete",
  "profile_avatar_set",
  "profile_phone_set",
  "profile_birth_date_set",
  "assessments_passed",
  "messages_sent",
] as const;
export type BadgeCriteriaType = (typeof BADGE_CRITERIA_TYPES)[number];

export const BADGE_LOCALES = ["en", "es"] as const;
export type BadgeLocale = (typeof BADGE_LOCALES)[number];

export type BadgeTranslation = { title: string; description: string };

export type BadgeCatalogEntry = {
  id: string;
  code: string;
  category: BadgeCategory;
  criteriaType: BadgeCriteriaType;
  criteriaThreshold: number;
  imagePath: string | null;
  isActive: boolean;
  sortOrder: number;
  translations: Partial<Record<BadgeLocale, BadgeTranslation>>;
};

export function isBadgeCategory(s: unknown): s is BadgeCategory {
  return typeof s === "string" && (BADGE_CATEGORIES as readonly string[]).includes(s);
}

export function isBadgeCriteriaType(s: unknown): s is BadgeCriteriaType {
  return typeof s === "string" && (BADGE_CRITERIA_TYPES as readonly string[]).includes(s);
}

export function isBadgeLocale(s: unknown): s is BadgeLocale {
  return typeof s === "string" && (BADGE_LOCALES as readonly string[]).includes(s);
}

/** Best-effort label resolver: prefer requested locale, then en, then es, then code. */
export function resolveBadgeTranslation(
  entry: Pick<BadgeCatalogEntry, "code" | "translations">,
  locale: string,
): BadgeTranslation {
  const t = entry.translations;
  const ll = isBadgeLocale(locale) ? locale : null;
  const pick = (l: BadgeLocale | null): BadgeTranslation | undefined => (l ? t[l] : undefined);
  return (
    pick(ll) ??
    pick("en") ??
    pick("es") ?? { title: entry.code, description: "" }
  );
}
