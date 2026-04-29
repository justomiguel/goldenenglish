import type { BadgeCategory, BadgeCriteriaType } from "@/lib/badges/badgeCatalog";
import type { Dictionary } from "@/types/i18n";

type AdminBadgesDict = Dictionary["admin"]["badges"];

export function adminBadgeCategoryLabel(c: BadgeCategory, labels: AdminBadgesDict): string {
  switch (c) {
    case "tasks":
      return labels.categoryTasks;
    case "attendance":
      return labels.categoryAttendance;
    case "profile":
      return labels.categoryProfile;
    case "learning":
      return labels.categoryLearning;
    case "community":
      return labels.categoryCommunity;
  }
}

export function adminBadgeCriteriaLabel(c: BadgeCriteriaType, labels: AdminBadgesDict): string {
  switch (c) {
    case "tasks_completed":
      return labels.criteriaTasksCompleted;
    case "attendance_streak":
      return labels.criteriaAttendanceStreak;
    case "attendance_days_total":
      return labels.criteriaAttendanceDaysTotal;
    case "profile_complete":
      return labels.criteriaProfileComplete;
    case "profile_avatar_set":
      return labels.criteriaProfileAvatarSet;
    case "profile_phone_set":
      return labels.criteriaProfilePhoneSet;
    case "profile_birth_date_set":
      return labels.criteriaProfileBirthDateSet;
    case "assessments_passed":
      return labels.criteriaAssessmentsPassed;
    case "messages_sent":
      return labels.criteriaMessagesSent;
  }
}
