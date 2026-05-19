import type { BadgeCategory, BadgeTranslation } from "@/lib/badges/badgeCatalog";

export type StudentBadgeProgress = {
  current: number;
  target: number;
  percent: number;
};

export type StudentBadgeRowModel = {
  id: string;
  badgeCode: string;
  earnedAt: string | null;
  shareUrl: string;
  locked: boolean;
  progress: StudentBadgeProgress | null;
  catalog?: {
    category: BadgeCategory;
    imageUrl: string | null;
    translations: Partial<Record<"en" | "es", BadgeTranslation>>;
  };
};
