export const PARENT_TOUR_ANCHORS = {
  tabBar: "parent-tab-bar",
  chromeHeader: "parent-chrome-header",
  chromeSignOut: "parent-chrome-sign-out",
  portalTopNav: "parent-portal-top-nav",
  portalAccount: "parent-portal-account",
  portalSubjectChips: "parent-portal-subject-chips",
  homeTitle: "parent-home-title",
  homeChildSwitcher: "parent-home-child-switcher",
  homeStatusPillars: "parent-home-status-pillars",
  homeInbox: "parent-home-inbox",
  calendarTitle: "parent-calendar-title",
  calendarBoard: "parent-calendar-board",
  childTitle: "parent-child-title",
  childBody: "parent-child-body",
  attendanceTitle: "parent-attendance-title",
  attendanceBody: "parent-attendance-body",
  paymentsTitle: "parent-payments-title",
  paymentsBody: "parent-payments-body",
  messagesTitle: "parent-messages-title",
  messagesFeed: "parent-messages-feed",
  messagesCompose: "parent-messages-compose",
  accountTitle: "parent-account-title",
  accountBody: "parent-account-body",
  profileForm: "parent-profile-form",
  billingTitle: "parent-billing-title",
  billingBody: "parent-billing-body",
  tasksTitle: "parent-tasks-title",
  tasksList: "parent-tasks-list",
  gradesTitle: "parent-grades-title",
  gradesBody: "parent-grades-body",
  feedbackTitle: "parent-feedback-title",
  feedbackBody: "parent-feedback-body",
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
