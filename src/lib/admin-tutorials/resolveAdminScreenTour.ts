import type { AdminScreenTourMatch } from "@/lib/admin-tutorials/screenCatalogTypes";
import {
  ADMIN_CONTENT_ROUTES,
  adminHomePath,
  adminProfilePath,
  stripTrailingSlash,
} from "@/lib/admin-tutorials/screenCatalogRoutes";

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

  const eventsPrefix = `${base}/events/`;
  if (pathOnly.startsWith(eventsPrefix)) {
    const segment = pathOnly.slice(eventsPrefix.length).split("/")[0];
    if (segment && segment !== "new") {
      return {
        id: "admin-event-detail",
        scope: "content-only",
        metaKey: "adminEventDetail",
      };
    }
  }

  const messagesPrefix = `${base}/messages/`;
  if (pathOnly.startsWith(messagesPrefix)) {
    const segment = pathOnly.slice(messagesPrefix.length).split("/")[0];
    if (segment && segment !== "compose") {
      return {
        id: "admin-message-detail",
        scope: "content-only",
        metaKey: "adminMessageDetail",
      };
    }
  }

  const blogPrefix = `${base}/cms/blog/`;
  if (pathOnly.startsWith(blogPrefix)) {
    const suffix = pathOnly.slice(blogPrefix.length);
    const parts = suffix.split("/");
    const articleId = parts[0];
    if (articleId && articleId !== "new" && parts[1] === "edit" && parts.length === 2) {
      return {
        id: "admin-blog-edit",
        scope: "content-only",
        metaKey: "adminBlogEdit",
      };
    }
  }

  const usersPrefix = `${base}/users/`;
  if (pathOnly.startsWith(usersPrefix)) {
    const suffix = pathOnly.slice(usersPrefix.length);
    const parts = suffix.split("/");
    const first = parts[0];
    if (first && first !== "new" && first !== "import") {
      if (parts[1] === "billing" && parts.length === 2) {
        return {
          id: "admin-user-billing",
          scope: "content-only",
          metaKey: "adminUserBilling",
        };
      }
      if (parts.length === 1) {
        return {
          id: "admin-user-detail",
          scope: "content-only",
          metaKey: "adminUserDetail",
        };
      }
    }
  }

  const financeCollectionsPrefix = `${base}/finance/collections/`;
  if (pathOnly.startsWith(financeCollectionsPrefix)) {
    const segment = pathOnly.slice(financeCollectionsPrefix.length).split("/")[0];
    if (segment) {
      return {
        id: "admin-finance-collections-section",
        scope: "content-only",
        metaKey: "adminFinanceCollectionsSection",
      };
    }
  }

  const financeReceiptsPrefix = `${base}/finance/receipts/`;
  if (pathOnly.startsWith(financeReceiptsPrefix)) {
    const segment = pathOnly.slice(financeReceiptsPrefix.length).split("/")[0];
    if (segment) {
      return {
        id: "admin-finance-receipt-detail",
        scope: "content-only",
        metaKey: "adminFinanceReceiptDetail",
      };
    }
  }

  const academicPrefix = `${base}/academic/`;
  if (pathOnly.startsWith(academicPrefix)) {
    const suffix = pathOnly.slice(academicPrefix.length);
    if (!suffix.startsWith("contents")) {
      const parts = suffix.split("/");
      if (parts.length === 3 && parts[2] === "attendance" && parts[0] && parts[1]) {
        return {
          id: "admin-section-attendance",
          scope: "content-only",
          metaKey: "adminSectionAttendance",
        };
      }
      if (parts.length === 2 && parts[0] && parts[1]) {
        return {
          id: "admin-section-detail",
          scope: "content-only",
          metaKey: "adminSectionDetail",
        };
      }
      if (parts.length === 1 && parts[0]) {
        return {
          id: "admin-cohort-detail",
          scope: "content-only",
          metaKey: "adminCohortDetail",
        };
      }
    }
  }

  return null;
}
