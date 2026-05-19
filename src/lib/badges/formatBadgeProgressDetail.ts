import type { Locale } from "@/types/i18n";
import type { StudentBadgeProgress } from "@/types/studentBadges";

export interface BadgeProgressCopy {
  progressFraction: string;
  progressComplete: string;
}

export function formatBadgeProgressDetail(
  locale: Locale,
  progress: StudentBadgeProgress,
  copy: BadgeProgressCopy,
): string {
  if (progress.percent >= 100 || progress.current >= progress.target) {
    return copy.progressComplete;
  }
  const nf = new Intl.NumberFormat(locale);
  return copy.progressFraction
    .replace("{current}", nf.format(progress.current))
    .replace("{target}", nf.format(progress.target));
}
