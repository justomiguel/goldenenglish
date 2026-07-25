export const PARENT_TOUR_ANCHORS = {
  sidebar: "parent-sidebar",
  tabBar: "parent-tab-bar",
  chromeHeader: "parent-chrome-header",
  chromeProfile: "parent-chrome-profile",
  chromeSignOut: "parent-chrome-sign-out",
  homeTitle: "parent-home-title",
  homeChildSwitcher: "parent-home-child-switcher",
  homeStatusPillars: "parent-home-status-pillars",
  homeInbox: "parent-home-inbox",
  calendarTitle: "parent-calendar-title",
  calendarBoard: "parent-calendar-board",
  progressTitle: "parent-progress-title",
  progressBody: "parent-progress-body",
  paymentsTitle: "parent-payments-title",
  paymentsBody: "parent-payments-body",
  messagesTitle: "parent-messages-title",
  messagesFeed: "parent-messages-feed",
  messagesCompose: "parent-messages-compose",
  settingsTitle: "parent-settings-title",
  settingsBody: "parent-settings-body",
  profileForm: "parent-profile-form",
  billingTitle: "parent-billing-title",
  billingBody: "parent-billing-body",
  tasksTitle: "parent-tasks-title",
  tasksList: "parent-tasks-list",
  assessmentsTitle: "parent-assessments-title",
  assessmentsBody: "parent-assessments-body",
  badgesTitle: "parent-badges-title",
  badgesBody: "parent-badges-body",
  childDetailTitle: "parent-child-detail-title",
  childDetailBody: "parent-child-detail-body",
} as const;

export type ParentTourAnchor =
  (typeof PARENT_TOUR_ANCHORS)[keyof typeof PARENT_TOUR_ANCHORS];

export function parentTourSelector(anchor: ParentTourAnchor): string {
  return `[data-tour="${anchor}"]`;
}
