/**
 * Admin tutorial catalog.
 * To add a tour: extend `AdminTutorialId`, append to `CATALOG` (with `icon` + `group`),
 * add dict entries under `adminHelpCatalog.<id>` + `adminHelpTours.*`, handle in
 * `startAdminTutorial`, and add `listTourRuntimeChecks` row (rule 33).
 * Copy: `.cursor/rules/31-admin-tutorials-copy.mdc`.
 */
export type AdminTutorialId =
  | "create-cohort"
  | "create-section"
  | "create-student"
  | "create-teacher"
  | "create-admin"
  | "create-event"
  | "approve-payment"
  | "reject-payment"
  | "take-attendance"
  | "assign-scholarship-percent"
  | "assign-scholarship-full"
  | "enable-mercadopago"
  | "enable-flow"
  | "change-billing-currency"
  | "approve-event-payment"
  | "assign-section-scholarship-bulk"
  | "change-site-setup-currency"
  | "create-blog-article"
  | "create-blog-article-as-teacher"
  | "reset-user-password"
  | "import-users";

export type AdminTutorialGroupId = "academic" | "billing" | "users" | "content";

/** Lucide-backed icon id for catalog list rows (see `tutorialCatalogIcons.ts`). */
export type AdminTutorialIconId =
  | "layers"
  | "users"
  | "graduationCap"
  | "school"
  | "shield"
  | "calendarPlus"
  | "badgeCheck"
  | "badgeX"
  | "clipboardList"
  | "percent"
  | "gift"
  | "creditCard"
  | "landmark"
  | "coins"
  | "newspaper"
  | "keyRound"
  | "upload";

export type AdminTutorialCatalogEntry = {
  id: AdminTutorialId;
  /** Dictionary path under dashboard.adminHelpCatalog.<id> */
  catalogKey: AdminTutorialId;
  icon: AdminTutorialIconId;
  group: AdminTutorialGroupId;
};

const CATALOG: readonly AdminTutorialCatalogEntry[] = [
  { id: "create-cohort", catalogKey: "create-cohort", icon: "layers", group: "academic" },
  { id: "create-section", catalogKey: "create-section", icon: "users", group: "academic" },
  {
    id: "take-attendance",
    catalogKey: "take-attendance",
    icon: "clipboardList",
    group: "academic",
  },
  { id: "approve-payment", catalogKey: "approve-payment", icon: "badgeCheck", group: "billing" },
  { id: "reject-payment", catalogKey: "reject-payment", icon: "badgeX", group: "billing" },
  {
    id: "assign-scholarship-percent",
    catalogKey: "assign-scholarship-percent",
    icon: "percent",
    group: "billing",
  },
  {
    id: "assign-scholarship-full",
    catalogKey: "assign-scholarship-full",
    icon: "gift",
    group: "billing",
  },
  {
    id: "enable-mercadopago",
    catalogKey: "enable-mercadopago",
    icon: "creditCard",
    group: "billing",
  },
  { id: "enable-flow", catalogKey: "enable-flow", icon: "landmark", group: "billing" },
  {
    id: "change-billing-currency",
    catalogKey: "change-billing-currency",
    icon: "coins",
    group: "billing",
  },
  {
    id: "approve-event-payment",
    catalogKey: "approve-event-payment",
    icon: "badgeCheck",
    group: "billing",
  },
  {
    id: "assign-section-scholarship-bulk",
    catalogKey: "assign-section-scholarship-bulk",
    icon: "percent",
    group: "billing",
  },
  {
    id: "change-site-setup-currency",
    catalogKey: "change-site-setup-currency",
    icon: "landmark",
    group: "billing",
  },
  { id: "create-student", catalogKey: "create-student", icon: "graduationCap", group: "users" },
  { id: "create-teacher", catalogKey: "create-teacher", icon: "school", group: "users" },
  { id: "create-admin", catalogKey: "create-admin", icon: "shield", group: "users" },
  {
    id: "reset-user-password",
    catalogKey: "reset-user-password",
    icon: "keyRound",
    group: "users",
  },
  { id: "import-users", catalogKey: "import-users", icon: "upload", group: "users" },
  { id: "create-event", catalogKey: "create-event", icon: "calendarPlus", group: "content" },
  {
    id: "create-blog-article",
    catalogKey: "create-blog-article",
    icon: "newspaper",
    group: "content",
  },
  {
    id: "create-blog-article-as-teacher",
    catalogKey: "create-blog-article-as-teacher",
    icon: "school",
    group: "content",
  },
];

export const ADMIN_TUTORIAL_GROUP_ORDER: readonly AdminTutorialGroupId[] = [
  "academic",
  "billing",
  "users",
  "content",
];

export function listAdminTutorials(): readonly AdminTutorialCatalogEntry[] {
  return CATALOG;
}

/** Catalog rows grouped for the Help FAB (stable group + catalog order). */
export function listAdminTutorialsByGroup(): readonly {
  group: AdminTutorialGroupId;
  tutorials: readonly AdminTutorialCatalogEntry[];
}[] {
  return ADMIN_TUTORIAL_GROUP_ORDER.map((group) => ({
    group,
    tutorials: CATALOG.filter((t) => t.group === group),
  })).filter((g) => g.tutorials.length > 0);
}
