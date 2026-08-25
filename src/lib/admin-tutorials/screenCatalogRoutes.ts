import type {
  AdminExactContentScreenTourId,
  AdminExactContentScreenTourMetaKey,
  AdminScreenTourId,
  AdminScreenTourMetaKey,
} from "@/lib/admin-tutorials/screenCatalogTypes";

export function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function adminHomePath(locale: string): string {
  return `/${locale}/dashboard/admin`;
}

export function adminProfilePath(locale: string): string {
  return `/${locale}/dashboard/profile`;
}

export function isAdminHomePath(pathname: string, locale: string): boolean {
  return stripTrailingSlash(pathname) === adminHomePath(locale);
}

export type ContentRoute = {
  /** Path under `/{locale}/dashboard/admin` (leading slash). Longer first. */
  adminSuffix: string;
  id: AdminExactContentScreenTourId;
  metaKey: AdminExactContentScreenTourMetaKey;
};

/** Exact admin suffixes — order matters: more specific before parents. */
export const ADMIN_CONTENT_ROUTES: readonly ContentRoute[] = [
  { adminSuffix: "/students", id: "admin-students", metaKey: "adminStudents" },
  { adminSuffix: "/teachers", id: "admin-teachers", metaKey: "adminTeachers" },
  { adminSuffix: "/institute", id: "admin-institute", metaKey: "adminInstitute" },
  { adminSuffix: "/users/import", id: "admin-users-import", metaKey: "adminUsersImport" },
  { adminSuffix: "/users/new", id: "admin-users-new", metaKey: "adminUsersNew" },
  { adminSuffix: "/events/new", id: "admin-events-new", metaKey: "adminEventsNew" },
  {
    adminSuffix: "/messages/compose",
    id: "admin-messages-compose",
    metaKey: "adminMessagesCompose",
  },
  { adminSuffix: "/academic/contents", id: "admin-contents", metaKey: "adminContents" },
  {
    adminSuffix: "/communications/templates",
    id: "admin-email-templates",
    metaKey: "adminEmailTemplates",
  },
  { adminSuffix: "/cms/blog/new", id: "admin-blog-new", metaKey: "adminBlogNew" },
  { adminSuffix: "/cms/blog", id: "admin-blog", metaKey: "adminBlog" },
  { adminSuffix: "/users", id: "admin-users", metaKey: "adminUsers" },
  { adminSuffix: "/registrations", id: "admin-registrations", metaKey: "adminRegistrations" },
  { adminSuffix: "/events", id: "admin-events", metaKey: "adminEvents" },
  { adminSuffix: "/finance", id: "admin-finance", metaKey: "adminFinance" },
  { adminSuffix: "/academic", id: "admin-academic", metaKey: "adminAcademic" },
  { adminSuffix: "/calendar", id: "admin-calendar", metaKey: "adminCalendar" },
  { adminSuffix: "/badges", id: "admin-badges", metaKey: "adminBadges" },
  { adminSuffix: "/coupons", id: "admin-coupons", metaKey: "adminCoupons" },
  { adminSuffix: "/promotions", id: "admin-promotions", metaKey: "adminPromotions" },
  { adminSuffix: "/messages", id: "admin-messages", metaKey: "adminMessages" },
  { adminSuffix: "/glossary", id: "admin-glossary", metaKey: "adminGlossary" },
  { adminSuffix: "/analytics", id: "admin-analytics", metaKey: "adminAnalytics" },
  { adminSuffix: "/audit", id: "admin-audit", metaKey: "adminAudit" },
  { adminSuffix: "/cms", id: "admin-cms", metaKey: "adminCms" },
  { adminSuffix: "/site-setup", id: "admin-site-setup", metaKey: "adminSiteSetup" },
  {
    adminSuffix: "/settings/integrations",
    id: "admin-settings-integrations",
    metaKey: "adminSettingsIntegrations",
  },
  { adminSuffix: "/settings", id: "admin-settings", metaKey: "adminSettings" },
];

/** All registered meta keys (for catalog contract tests). */
export function listAdminScreenTourMetaKeys(): readonly AdminScreenTourMetaKey[] {
  return [
    "adminHome",
    ...ADMIN_CONTENT_ROUTES.map((r) => r.metaKey),
    "adminEventDetail",
    "adminMessageDetail",
    "adminUserDetail",
    "adminUserBilling",
    "adminBlogEdit",
    "adminCohortDetail",
    "adminSectionDetail",
    "adminSectionAttendance",
    "adminFinanceCollectionsSection",
    "adminFinanceReceiptDetail",
    "adminProfile",
  ];
}

/** Every screen-explain tour id (L3 / runtime matrix must cover each). */
export function listAdminScreenTourIds(): readonly AdminScreenTourId[] {
  return [
    "admin-home",
    ...ADMIN_CONTENT_ROUTES.map((r) => r.id),
    "admin-event-detail",
    "admin-message-detail",
    "admin-user-detail",
    "admin-user-billing",
    "admin-blog-edit",
    "admin-cohort-detail",
    "admin-section-detail",
    "admin-section-attendance",
    "admin-finance-collections-section",
    "admin-finance-receipt-detail",
    "admin-profile",
  ];
}

export function cohortDetailPath(locale: string, cohortId: string): string {
  return `/${locale}/dashboard/admin/academic/${cohortId}`;
}

export function sectionAttendanceScreenPath(
  locale: string,
  cohortId: string,
  sectionId: string,
): string {
  return `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`;
}

export function sectionDetailScreenPath(
  locale: string,
  cohortId: string,
  sectionId: string,
): string {
  return `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`;
}

export function financeCollectionsSectionPath(locale: string, sectionId: string): string {
  return `/${locale}/dashboard/admin/finance/collections/${sectionId}`;
}

export function financeReceiptDetailPath(locale: string, receiptId: string): string {
  return `/${locale}/dashboard/admin/finance/receipts/${receiptId}`;
}

export function blogArticleEditPath(locale: string, articleId: string): string {
  return `/${locale}/dashboard/admin/cms/blog/${articleId}/edit`;
}

export function eventDetailPath(locale: string, eventId: string): string {
  return `/${locale}/dashboard/admin/events/${eventId}`;
}

export function messageDetailPath(locale: string, messageId: string): string {
  return `/${locale}/dashboard/admin/messages/${messageId}`;
}

export function userDetailPath(locale: string, userId: string): string {
  return `/${locale}/dashboard/admin/users/${userId}`;
}

export function userBillingPath(locale: string, userId: string): string {
  return `/${locale}/dashboard/admin/users/${userId}/billing`;
}

export function adminScreenPath(
  locale: string,
  id: AdminExactContentScreenTourId,
): string {
  const row = ADMIN_CONTENT_ROUTES.find((r) => r.id === id);
  if (!row) throw new Error(`Unknown admin screen tour id: ${id}`);
  return `${adminHomePath(locale)}${row.adminSuffix}`;
}
