/**
 * Admin tutorial catalog.
 * To add a tour: extend `AdminTutorialId`, append to `CATALOG` (with `icon`), add dict entries under
 * `adminHelpCatalog.<id>` + `adminHelpTours.*`, and handle the id in `startAdminTutorial`.
 * Copy rules: `.cursor/rules/31-admin-tutorials-copy.mdc`.
 * The FAB list renders one Play button per catalog row automatically.
 */
export type AdminTutorialId =
  | "create-cohort"
  | "create-section"
  | "create-student"
  | "create-teacher"
  | "create-admin";

/** Lucide-backed icon id for catalog list rows (see `tutorialCatalogIcons.ts`). */
export type AdminTutorialIconId =
  | "layers"
  | "users"
  | "graduationCap"
  | "school"
  | "shield";

export type AdminTutorialCatalogEntry = {
  id: AdminTutorialId;
  /** Dictionary path under dashboard.adminHelpCatalog.<id> */
  catalogKey: AdminTutorialId;
  icon: AdminTutorialIconId;
};

const CATALOG: readonly AdminTutorialCatalogEntry[] = [
  { id: "create-cohort", catalogKey: "create-cohort", icon: "layers" },
  { id: "create-section", catalogKey: "create-section", icon: "users" },
  { id: "create-student", catalogKey: "create-student", icon: "graduationCap" },
  { id: "create-teacher", catalogKey: "create-teacher", icon: "school" },
  { id: "create-admin", catalogKey: "create-admin", icon: "shield" },
];

export function listAdminTutorials(): readonly AdminTutorialCatalogEntry[] {
  return CATALOG;
}
