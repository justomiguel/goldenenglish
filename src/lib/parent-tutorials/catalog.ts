/**
 * Parent / tutor tutorial catalog (task tours).
 * Add id → CATALOG row → dict parentHelpCatalog + parentHelpTours → startParentTutorial.
 */

export type ParentTutorialId =
  | "parent-pay-or-upload-receipt"
  | "parent-view-child-progress"
  | "parent-read-reply-messages"
  | "parent-manage-child-or-tutor-profile"
  | "parent-calendar-attendance"
  | "parent-badges-overview"
  | "parent-settings-notifications";

export type ParentTutorialIconId =
  | "wallet"
  | "trendingUp"
  | "messageCircle"
  | "user"
  | "calendar"
  | "award"
  | "settings";

export type ParentTutorialCatalogEntry = {
  id: ParentTutorialId;
  catalogKey: ParentTutorialId;
  icon: ParentTutorialIconId;
};

const CATALOG: readonly ParentTutorialCatalogEntry[] = [
  {
    id: "parent-pay-or-upload-receipt",
    catalogKey: "parent-pay-or-upload-receipt",
    icon: "wallet",
  },
  {
    id: "parent-view-child-progress",
    catalogKey: "parent-view-child-progress",
    icon: "trendingUp",
  },
  {
    id: "parent-read-reply-messages",
    catalogKey: "parent-read-reply-messages",
    icon: "messageCircle",
  },
  {
    id: "parent-manage-child-or-tutor-profile",
    catalogKey: "parent-manage-child-or-tutor-profile",
    icon: "user",
  },
  {
    id: "parent-calendar-attendance",
    catalogKey: "parent-calendar-attendance",
    icon: "calendar",
  },
  {
    id: "parent-badges-overview",
    catalogKey: "parent-badges-overview",
    icon: "award",
  },
  {
    id: "parent-settings-notifications",
    catalogKey: "parent-settings-notifications",
    icon: "settings",
  },
];

export function listParentTutorials(): readonly ParentTutorialCatalogEntry[] {
  return CATALOG;
}

export function listParentTutorialIds(): ParentTutorialId[] {
  return CATALOG.map((e) => e.id);
}
