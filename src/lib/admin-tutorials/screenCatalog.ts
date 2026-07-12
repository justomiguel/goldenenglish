/**
 * Contextual “explain this screen” catalog.
 * Hub home is the only tour with chrome + content; all others are content-only.
 */

export type AdminScreenTourId =
  | "admin-home"
  | "admin-users"
  | "admin-registrations"
  | "admin-events"
  | "admin-finance"
  | "admin-academic"
  | "admin-calendar"
  | "admin-contents"
  | "admin-badges"
  | "admin-coupons"
  | "admin-promotions"
  | "admin-messages"
  | "admin-email-templates"
  | "admin-blog"
  | "admin-glossary"
  | "admin-analytics"
  | "admin-audit"
  | "admin-cms"
  | "admin-site-setup"
  | "admin-settings"
  | "admin-profile";

export type AdminScreenTourScope = "chrome-and-content" | "content-only";

/** Dictionary key under dashboard.adminHelpScreenTours.<metaKey> */
export type AdminScreenTourMetaKey =
  | "adminHome"
  | "adminUsers"
  | "adminRegistrations"
  | "adminEvents"
  | "adminFinance"
  | "adminAcademic"
  | "adminCalendar"
  | "adminContents"
  | "adminBadges"
  | "adminCoupons"
  | "adminPromotions"
  | "adminMessages"
  | "adminEmailTemplates"
  | "adminBlog"
  | "adminGlossary"
  | "adminAnalytics"
  | "adminAudit"
  | "adminCms"
  | "adminSiteSetup"
  | "adminSettings"
  | "adminProfile";

export type AdminScreenTourMatch = {
  id: AdminScreenTourId;
  scope: AdminScreenTourScope;
  metaKey: AdminScreenTourMetaKey;
};

function stripTrailingSlash(path: string): string {
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

type ContentRoute = {
  /** Path under `/{locale}/dashboard/admin` (leading slash). Longer first. */
  adminSuffix: string;
  id: Exclude<AdminScreenTourId, "admin-home" | "admin-profile">;
  metaKey: Exclude<AdminScreenTourMetaKey, "adminHome" | "adminProfile">;
};

/** Exact admin suffixes — order matters: more specific before parents. */
const ADMIN_CONTENT_ROUTES: readonly ContentRoute[] = [
  { adminSuffix: "/academic/contents", id: "admin-contents", metaKey: "adminContents" },
  {
    adminSuffix: "/communications/templates",
    id: "admin-email-templates",
    metaKey: "adminEmailTemplates",
  },
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
  { adminSuffix: "/settings", id: "admin-settings", metaKey: "adminSettings" },
];

/** All registered meta keys (for catalog contract tests). */
export function listAdminScreenTourMetaKeys(): readonly AdminScreenTourMetaKey[] {
  return [
    "adminHome",
    ...ADMIN_CONTENT_ROUTES.map((r) => r.metaKey),
    "adminProfile",
  ];
}

export function adminScreenPath(
  locale: string,
  id: Exclude<AdminScreenTourId, "admin-home" | "admin-profile">,
): string {
  const row = ADMIN_CONTENT_ROUTES.find((r) => r.id === id);
  if (!row) throw new Error(`Unknown admin screen tour id: ${id}`);
  return `${adminHomePath(locale)}${row.adminSuffix}`;
}

/** Resolve a screen-explain tour for the current admin pathname, or null. */
export function resolveAdminScreenTour(
  pathname: string,
  locale: string,
): AdminScreenTourMatch | null {
  const pathOnly = stripTrailingSlash(pathname.split("?")[0] ?? pathname);

  if (pathOnly === adminHomePath(locale)) {
    return {
      id: "admin-home",
      scope: "chrome-and-content",
      metaKey: "adminHome",
    };
  }

  if (pathOnly === adminProfilePath(locale)) {
    return {
      id: "admin-profile",
      scope: "content-only",
      metaKey: "adminProfile",
    };
  }

  const base = adminHomePath(locale);
  for (const row of ADMIN_CONTENT_ROUTES) {
    if (pathOnly === `${base}${row.adminSuffix}`) {
      return {
        id: row.id,
        scope: "content-only",
        metaKey: row.metaKey,
      };
    }
  }

  return null;
}
