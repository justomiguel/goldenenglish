export const ADMIN_TOUR_ANCHORS = {
  navAcademic: "admin-nav-academic",
  newCohort: "academic-new-cohort",
  newCohortName: "academic-new-cohort-name",
  newCohortSubmit: "academic-new-cohort-submit",
  cohortDetail: "academic-cohort-detail",
  cohortSectionsTab: "academic-cohort-sections-tab",
  newSection: "academic-new-section",
  newSectionBasics: "academic-new-section-basics",
  newSectionPeriod: "academic-new-section-period",
  newSectionSchedule: "academic-new-section-schedule",
  newSectionSubmit: "academic-new-section-submit",
  sectionDetail: "academic-section-detail",
  /** Explain-screen: admin chrome / hub */
  sidebar: "admin-sidebar",
  chromeHeader: "admin-chrome-header",
  hubTitle: "admin-hub-title",
  hubStudentsWithoutSection: "admin-hub-students-without-section",
  hubBirthdays: "admin-hub-birthdays",
  hubTraffic: "admin-hub-traffic",
  hubUsers: "admin-hub-users",
  hubPayments: "admin-hub-payments",
  hubRegistrations: "admin-hub-registrations",
  hubMessages: "admin-hub-messages",
  chromeBackToSite: "admin-chrome-back-to-site",
  chromeTeacherPortal: "admin-chrome-teacher-portal",
  chromeSignOut: "admin-chrome-sign-out",
  chromeLocale: "admin-chrome-locale",
  /** Create-user form tours */
  navUsers: "admin-nav-users",
  usersNavAdd: "admin-users-nav-add",
  createUserForm: "admin-create-user-form",
  createUserRole: "admin-create-user-role",
  createUserFirstName: "admin-create-user-first-name",
  createUserLastName: "admin-create-user-last-name",
  createUserDni: "admin-create-user-dni",
  createUserPhone: "admin-create-user-phone",
  createUserBirth: "admin-create-user-birth",
  createUserEmail: "admin-create-user-email",
  createUserPassword: "admin-create-user-password",
  createUserMinorHint: "admin-create-user-minor-hint",
  createUserGuardian: "admin-create-user-guardian",
  createUserGuardianMode: "admin-create-user-guardian-mode",
  createUserGuardianSearch: "admin-create-user-guardian-search",
  createUserGuardianNew: "admin-create-user-guardian-new",
  createUserRelationship: "admin-create-user-relationship",
  createUserSubmit: "admin-create-user-submit",
  /** Explain-screen: content-only (sidebar destinations) */
  usersSubnav: "admin-users-subnav",
  usersTitle: "admin-users-title",
  usersToolbar: "admin-users-toolbar",
  usersTable: "admin-users-table",
  registrationsTitle: "admin-registrations-title",
  registrationsToolbar: "admin-registrations-toolbar",
  registrationsTable: "admin-registrations-table",
  eventsTitle: "admin-events-title",
  eventsKpis: "admin-events-kpis",
  eventsCreateCta: "admin-events-create-cta",
  eventsTable: "admin-events-table",
  financeHeader: "admin-finance-header",
  financeTabs: "admin-finance-tabs",
  financeCohortYear: "admin-finance-cohort-year",
  financeWorkspace: "admin-finance-workspace",
  academicTitle: "admin-academic-title",
  academicBoardTabs: "admin-academic-board-tabs",
  academicCohortList: "admin-academic-cohort-list",
  calendarTitle: "admin-calendar-title",
  calendarFilters: "admin-calendar-filters",
  calendarSchedule: "admin-calendar-schedule",
  contentsTitle: "admin-contents-title",
  contentsTabs: "admin-contents-tabs",
  contentsWorkspace: "admin-contents-workspace",
  badgesHeader: "admin-badges-header",
  badgesCreateCta: "admin-badges-create-cta",
  badgesCategoryTabs: "admin-badges-category-tabs",
  badgesTable: "admin-badges-table",
  couponsTitle: "admin-coupons-title",
  couponsCreateForm: "admin-coupons-create-form",
  couponsTable: "admin-coupons-table",
  promotionsTitle: "admin-promotions-title",
  promotionsCreateForm: "admin-promotions-create-form",
  promotionsTable: "admin-promotions-table",
  messagesTitle: "admin-messages-title",
  messagesComposeCta: "admin-messages-compose-cta",
  messagesTabs: "admin-messages-tabs",
  messagesList: "admin-messages-list",
  emailTemplatesTitle: "admin-email-templates-title",
  emailTemplatesSelect: "admin-email-templates-select",
  emailTemplatesEditor: "admin-email-templates-editor",
  emailTemplatesPreview: "admin-email-templates-preview",
  blogTitle: "admin-blog-title",
  blogCreateCta: "admin-blog-create-cta",
  blogArticleList: "admin-blog-article-list",
  glossaryTitle: "admin-glossary-title",
  glossaryHierarchy: "admin-glossary-hierarchy",
  glossaryGroups: "admin-glossary-groups",
  analyticsTitle: "admin-analytics-title",
  analyticsTraffic: "admin-analytics-traffic",
  analyticsCharts: "admin-analytics-charts",
  auditTitle: "admin-audit-title",
  auditToolbar: "admin-audit-toolbar",
  auditTable: "admin-audit-table",
  cmsTitle: "admin-cms-title",
  cmsTemplatesCard: "admin-cms-templates-card",
  cmsBlogCard: "admin-cms-blog-card",
  siteSetupStepIndicator: "admin-site-setup-step-indicator",
  siteSetupPanel: "admin-site-setup-panel",
  siteSetupNav: "admin-site-setup-nav",
  settingsTitle: "admin-settings-title",
  settingsInscriptions: "admin-settings-inscriptions",
  settingsClassReminders: "admin-settings-class-reminders",
  settingsBlogTranslate: "admin-settings-blog-translate",
  profileHeader: "admin-profile-header",
  profileAvatar: "admin-profile-avatar",
  profilePersonalForm: "admin-profile-personal-form",
  profilePassword: "admin-profile-password",
} as const;

export type AdminTourAnchor = (typeof ADMIN_TOUR_ANCHORS)[keyof typeof ADMIN_TOUR_ANCHORS];

/** Dispatched on `window` so AcademicHubToolbar can open the new-cohort modal during a tour. */
export const ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT = "ge:admin-tutorial:open-new-cohort";

/** Switches AcademicCohortDetailShell to the sections tab during a tour. */
export const ADMIN_TUTORIAL_ACTIVATE_COHORT_SECTIONS_TAB_EVENT =
  "ge:admin-tutorial:activate-cohort-sections-tab";

/** Dispatched on `window` so CohortSectionsToolbar can open the new-section modal during a tour. */
export const ADMIN_TUTORIAL_OPEN_NEW_SECTION_EVENT = "ge:admin-tutorial:open-new-section";

/**
 * Dispatched on `window` so `useAdminCreateUserForm` can apply role + sample birth date
 * for guide-only create-user tours (React-controlled fields).
 */
export const ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT =
  "ge:admin-tutorial:apply-create-user-demo";

export function adminTourSelector(anchor: AdminTourAnchor): string {
  return `[data-tour="${anchor}"]`;
}
