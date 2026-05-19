import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpenCheck,
  CalendarCheck,
  Flame,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Star,
  Trophy,
  UserRoundCheck,
} from "lucide-react";
import {
  BADGE_ATTENDANCE_STREAK_5,
  BADGE_FIRST_ASSESSMENT_PASSED,
  BADGE_PROFILE_COMPLETE,
  BADGE_TASKS_1,
  BADGE_TASKS_10,
  BADGE_TASKS_5,
} from "@/lib/badges/badgeCodes";
import type { BadgeCategory } from "@/lib/badges/badgeCatalog";

export interface BadgeAchievementVisual {
  Icon: LucideIcon;
  shellClassName: string;
  iconClassName: string;
  chipClassName: string;
}

const CATEGORY_DEFAULTS: Record<BadgeCategory, BadgeAchievementVisual> = {
  tasks: {
    Icon: BookOpenCheck,
    shellClassName:
      "bg-gradient-to-br from-[var(--color-primary)]/25 via-[var(--color-primary)]/10 to-[var(--color-surface)] ring-2 ring-[var(--color-primary)]/35",
    iconClassName: "text-[var(--color-primary)]",
    chipClassName:
      "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
  },
  attendance: {
    Icon: CalendarCheck,
    shellClassName:
      "bg-gradient-to-br from-[var(--color-success)]/30 via-[var(--color-success)]/10 to-[var(--color-surface)] ring-2 ring-[var(--color-success)]/40",
    iconClassName: "text-[var(--color-success)]",
    chipClassName:
      "border-[var(--color-success)]/40 bg-[var(--color-success)]/10 text-[var(--color-success)]",
  },
  profile: {
    Icon: Sparkles,
    shellClassName:
      "bg-gradient-to-br from-[var(--color-secondary)]/25 via-[var(--color-secondary)]/10 to-[var(--color-surface)] ring-2 ring-[var(--color-secondary)]/35",
    iconClassName: "text-[var(--color-secondary)]",
    chipClassName:
      "border-[var(--color-secondary)]/40 bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]",
  },
  learning: {
    Icon: GraduationCap,
    shellClassName:
      "bg-gradient-to-br from-[var(--color-accent)]/30 via-[var(--color-accent)]/10 to-[var(--color-surface)] ring-2 ring-[var(--color-accent)]/40",
    iconClassName: "text-[var(--color-accent)]",
    chipClassName:
      "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 text-[var(--color-accent)]",
  },
  community: {
    Icon: MessageCircle,
    shellClassName:
      "bg-gradient-to-br from-[var(--color-primary)]/20 via-[var(--color-muted)]/30 to-[var(--color-surface)] ring-2 ring-[var(--color-border)]",
    iconClassName: "text-[var(--color-primary)]",
    chipClassName:
      "border-[var(--color-border)] bg-[var(--color-muted)]/50 text-[var(--color-foreground)]",
  },
};

const CODE_ICON: Partial<Record<string, LucideIcon>> = {
  [BADGE_TASKS_1]: Star,
  [BADGE_TASKS_5]: Award,
  [BADGE_TASKS_10]: Trophy,
  [BADGE_ATTENDANCE_STREAK_5]: Flame,
  [BADGE_PROFILE_COMPLETE]: UserRoundCheck,
  [BADGE_FIRST_ASSESSMENT_PASSED]: GraduationCap,
};

export function resolveBadgeAchievementVisual(
  category: BadgeCategory,
  badgeCode: string,
): BadgeAchievementVisual {
  const base = CATEGORY_DEFAULTS[category];
  const Icon = CODE_ICON[badgeCode] ?? base.Icon;
  return { ...base, Icon };
}
