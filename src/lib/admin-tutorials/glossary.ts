/**
 * Admin help glossary — pure catalog of domain terms (no React).
 * Copy lives in `dashboard.adminHelpGlossary.terms.<dictKey>`.
 */

import type { AdminNavIconId } from "@/lib/dashboard/adminNavLucideIcons";

export type AdminGlossaryTermId =
  | "cohort"
  | "current-cohort"
  | "section"
  | "course"
  | "academic-hub"
  | "learning-route"
  | "student"
  | "guardian"
  | "teacher"
  | "enrollment-fee"
  | "section-enrollment"
  | "promotion"
  | "coupon"
  | "transfer"
  | "public-registration";

/** Same Lucide ids as admin sidebar nav (`adminNavLucideIcons`). */
export type AdminGlossaryIconId = AdminNavIconId;

export type AdminGlossaryGroupId = "structure" | "people" | "billing" | "operations";

export type AdminGlossaryEntry = {
  id: AdminGlossaryTermId;
  /** Dictionary key under `dashboard.adminHelpGlossary.terms`. */
  dictKey: AdminGlossaryTermId;
  icon: AdminGlossaryIconId;
  group: AdminGlossaryGroupId;
  related?: readonly AdminGlossaryTermId[];
};

const GLOSSARY: readonly AdminGlossaryEntry[] = [
  {
    id: "cohort",
    dictKey: "cohort",
    icon: "calendar-days",
    group: "structure",
    related: ["current-cohort", "section", "academic-hub"],
  },
  {
    id: "current-cohort",
    dictKey: "current-cohort",
    icon: "calendar-days",
    group: "structure",
    related: ["cohort", "section-enrollment", "public-registration"],
  },
  {
    id: "section",
    dictKey: "section",
    icon: "calendar",
    group: "structure",
    related: ["cohort", "course", "teacher", "section-enrollment"],
  },
  {
    id: "course",
    dictKey: "course",
    icon: "book-open-check",
    group: "structure",
    related: ["section", "learning-route"],
  },
  {
    id: "academic-hub",
    dictKey: "academic-hub",
    icon: "calendar-days",
    group: "structure",
    related: ["cohort", "section", "transfer"],
  },
  {
    id: "learning-route",
    dictKey: "learning-route",
    icon: "book-open-check",
    group: "structure",
    related: ["course", "section"],
  },
  {
    id: "student",
    dictKey: "student",
    icon: "users",
    group: "people",
    related: ["guardian", "section-enrollment"],
  },
  {
    id: "guardian",
    dictKey: "guardian",
    icon: "users",
    group: "people",
    related: ["student", "public-registration"],
  },
  {
    id: "teacher",
    dictKey: "teacher",
    icon: "users",
    group: "people",
    related: ["section", "transfer"],
  },
  {
    id: "enrollment-fee",
    dictKey: "enrollment-fee",
    icon: "banknote",
    group: "billing",
    related: ["promotion", "coupon", "section-enrollment"],
  },
  {
    id: "section-enrollment",
    dictKey: "section-enrollment",
    icon: "clipboard-list",
    group: "operations",
    related: ["section", "student", "current-cohort"],
  },
  {
    id: "promotion",
    dictKey: "promotion",
    icon: "gift",
    group: "billing",
    related: ["coupon", "enrollment-fee"],
  },
  {
    id: "coupon",
    dictKey: "coupon",
    icon: "ticket",
    group: "billing",
    related: ["promotion"],
  },
  {
    id: "transfer",
    dictKey: "transfer",
    icon: "calendar-days",
    group: "operations",
    related: ["section", "academic-hub", "teacher"],
  },
  {
    id: "public-registration",
    dictKey: "public-registration",
    icon: "clipboard-list",
    group: "operations",
    related: ["guardian", "current-cohort"],
  },
] as const;

const GROUP_ORDER: readonly AdminGlossaryGroupId[] = [
  "structure",
  "people",
  "billing",
  "operations",
];

export function listAdminGlossaryTerms(): readonly AdminGlossaryEntry[] {
  return GLOSSARY;
}

export function listAdminGlossaryGroups(): readonly AdminGlossaryGroupId[] {
  return GROUP_ORDER;
}

export function termsByGlossaryGroup(
  group: AdminGlossaryGroupId,
): readonly AdminGlossaryEntry[] {
  return GLOSSARY.filter((t) => t.group === group);
}
