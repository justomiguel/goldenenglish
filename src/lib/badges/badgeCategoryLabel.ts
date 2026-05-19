import type { BadgeCategory } from "@/lib/badges/badgeCatalog";

type BadgeCategoryLabels = {
  categoryTasks: string;
  categoryAttendance: string;
  categoryProfile: string;
  categoryLearning: string;
  categoryCommunity: string;
};

export function badgeCategoryLabel(category: BadgeCategory, labels: BadgeCategoryLabels): string {
  if (category === "tasks") return labels.categoryTasks;
  if (category === "attendance") return labels.categoryAttendance;
  if (category === "profile") return labels.categoryProfile;
  if (category === "community") return labels.categoryCommunity;
  return labels.categoryLearning;
}
