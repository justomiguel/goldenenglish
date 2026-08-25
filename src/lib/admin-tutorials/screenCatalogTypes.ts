/**
 * Contextual “explain this screen” catalog types.
 * Hub home is the only tour with chrome + content; all others are content-only.
 */

export type AdminScreenTourId =
  | "admin-home"
  | "admin-students"
  | "admin-teachers"
  | "admin-institute"
  | "admin-users"
  | "admin-users-new"
  | "admin-users-import"
  | "admin-user-detail"
  | "admin-user-billing"
  | "admin-registrations"
  | "admin-events"
  | "admin-events-new"
  | "admin-event-detail"
  | "admin-finance"
  | "admin-academic"
  | "admin-cohort-detail"
  | "admin-section-detail"
  | "admin-section-attendance"
  | "admin-calendar"
  | "admin-contents"
  | "admin-badges"
  | "admin-coupons"
  | "admin-promotions"
  | "admin-messages"
  | "admin-messages-compose"
  | "admin-message-detail"
  | "admin-email-templates"
  | "admin-blog"
  | "admin-blog-new"
  | "admin-blog-edit"
  | "admin-glossary"
  | "admin-analytics"
  | "admin-audit"
  | "admin-cms"
  | "admin-site-setup"
  | "admin-settings"
  | "admin-settings-integrations"
  | "admin-finance-collections-section"
  | "admin-finance-receipt-detail"
  | "admin-profile";

export type AdminScreenTourScope = "chrome-and-content" | "content-only";

/** Dictionary key under dashboard.adminHelpScreenTours.<metaKey> */
export type AdminScreenTourMetaKey =
  | "adminHome"
  | "adminStudents"
  | "adminTeachers"
  | "adminInstitute"
  | "adminUsers"
  | "adminUsersNew"
  | "adminUsersImport"
  | "adminUserDetail"
  | "adminUserBilling"
  | "adminRegistrations"
  | "adminEvents"
  | "adminEventsNew"
  | "adminEventDetail"
  | "adminFinance"
  | "adminAcademic"
  | "adminCohortDetail"
  | "adminSectionDetail"
  | "adminSectionAttendance"
  | "adminCalendar"
  | "adminContents"
  | "adminBadges"
  | "adminCoupons"
  | "adminPromotions"
  | "adminMessages"
  | "adminMessagesCompose"
  | "adminMessageDetail"
  | "adminEmailTemplates"
  | "adminBlog"
  | "adminBlogNew"
  | "adminBlogEdit"
  | "adminGlossary"
  | "adminAnalytics"
  | "adminAudit"
  | "adminCms"
  | "adminSiteSetup"
  | "adminSettings"
  | "adminSettingsIntegrations"
  | "adminFinanceCollectionsSection"
  | "adminFinanceReceiptDetail"
  | "adminProfile";

export type AdminScreenTourMatch = {
  id: AdminScreenTourId;
  scope: AdminScreenTourScope;
  metaKey: AdminScreenTourMetaKey;
};

/** Exact-route ids (no dynamic entity segment). */
export type AdminExactContentScreenTourId = Exclude<
  AdminScreenTourId,
  | "admin-home"
  | "admin-profile"
  | "admin-event-detail"
  | "admin-message-detail"
  | "admin-user-detail"
  | "admin-user-billing"
  | "admin-blog-edit"
  | "admin-cohort-detail"
  | "admin-section-detail"
  | "admin-section-attendance"
  | "admin-finance-collections-section"
  | "admin-finance-receipt-detail"
>;

export type AdminExactContentScreenTourMetaKey = Exclude<
  AdminScreenTourMetaKey,
  | "adminHome"
  | "adminProfile"
  | "adminEventDetail"
  | "adminMessageDetail"
  | "adminUserDetail"
  | "adminUserBilling"
  | "adminBlogEdit"
  | "adminCohortDetail"
  | "adminSectionDetail"
  | "adminSectionAttendance"
  | "adminFinanceCollectionsSection"
  | "adminFinanceReceiptDetail"
>;
