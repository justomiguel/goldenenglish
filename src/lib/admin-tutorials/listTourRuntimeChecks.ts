import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import {
  adminHomePath,
  adminProfilePath,
  adminScreenPath,
  blogArticleEditPath,
  cohortDetailPath,
  eventDetailPath,
  financeCollectionsSectionPath,
  financeReceiptDetailPath,
  messageDetailPath,
  sectionAttendanceScreenPath,
  sectionDetailScreenPath,
  userBillingPath,
  userDetailPath,
} from "@/lib/admin-tutorials/screenCatalog";
import {
  CONTENT_ONLY_SCREEN_TOUR_DEFS,
  type ContentOnlyScreenTourId,
} from "@/lib/admin-tutorials/screenTourDefs";
import { requiredAnchorsFromContentOnlyDefs } from "@/lib/admin-tutorials/requiredAnchorsFromContentOnlyDefs";
import type {
  TourRuntimeCheck,
  TourRuntimeEnv,
} from "@/lib/admin-tutorials/listTourRuntimeCheckTypes";
import { listTourRuntimeTaskChecks } from "@/lib/admin-tutorials/listTourRuntimeTaskChecks";

export type { TourRuntimeCheck, TourRuntimeEnv } from "@/lib/admin-tutorials/listTourRuntimeCheckTypes";

const ADMIN_HOME_RUNTIME_ANCHORS: readonly AdminTourAnchor[] = [
  ADMIN_TOUR_ANCHORS.sidebar,
  ADMIN_TOUR_ANCHORS.chromeHeader,
  ADMIN_TOUR_ANCHORS.chromeBackToSite,
  ADMIN_TOUR_ANCHORS.chromeSignOut,
  ADMIN_TOUR_ANCHORS.chromeLocale,
  ADMIN_TOUR_ANCHORS.hubTitle,
  ADMIN_TOUR_ANCHORS.hubBirthdays,
  ADMIN_TOUR_ANCHORS.hubTraffic,
  ADMIN_TOUR_ANCHORS.hubUsers,
  ADMIN_TOUR_ANCHORS.hubPayments,
  ADMIN_TOUR_ANCHORS.hubRegistrations,
  ADMIN_TOUR_ANCHORS.hubMessages,
];

function contentOnlyScreenCheck(id: ContentOnlyScreenTourId): TourRuntimeCheck {
  return {
    id: `screen:${id}`,
    pathFor: (locale, env) => {
      if (id === "admin-profile") return adminProfilePath(locale);
      if (id === "admin-event-detail") {
        if (!env.eventId) return null;
        return eventDetailPath(locale, env.eventId);
      }
      if (id === "admin-message-detail") {
        if (!env.messageId) return null;
        return messageDetailPath(locale, env.messageId);
      }
      if (id === "admin-user-detail") {
        if (!env.studentId) return null;
        return userDetailPath(locale, env.studentId);
      }
      if (id === "admin-user-billing") {
        if (!env.studentId) return null;
        return userBillingPath(locale, env.studentId);
      }
      if (id === "admin-blog-edit") {
        if (!env.blogArticleId) return null;
        return blogArticleEditPath(locale, env.blogArticleId);
      }
      if (id === "admin-cohort-detail") {
        if (!env.cohortId) return null;
        return cohortDetailPath(locale, env.cohortId);
      }
      if (id === "admin-section-attendance") {
        if (!env.cohortId || !env.sectionId) return null;
        return sectionAttendanceScreenPath(locale, env.cohortId, env.sectionId);
      }
      if (id === "admin-section-detail") {
        if (!env.cohortId || !env.sectionId) return null;
        return sectionDetailScreenPath(locale, env.cohortId, env.sectionId);
      }
      if (id === "admin-finance-collections-section") {
        if (!env.sectionId) return null;
        return financeCollectionsSectionPath(locale, env.sectionId);
      }
      if (id === "admin-finance-receipt-detail") {
        if (!env.receiptId) return null;
        return financeReceiptDetailPath(locale, env.receiptId);
      }
      return adminScreenPath(locale, id);
    },
    anchors: requiredAnchorsFromContentOnlyDefs(CONTENT_ONLY_SCREEN_TOUR_DEFS[id]),
  };
}

/**
 * Shared matrix for Vitest consistency checks and Playwright `@admin-tours` smokes.
 * Every AdminScreenTourId + AdminTutorialId must appear (rule 33).
 */
export function listTourRuntimeChecks(): readonly TourRuntimeCheck[] {
  const contentOnlyIds = Object.keys(
    CONTENT_ONLY_SCREEN_TOUR_DEFS,
  ) as ContentOnlyScreenTourId[];

  return [
    {
      id: "screen:admin-home",
      pathFor: (locale) => adminHomePath(locale),
      anchors: ADMIN_HOME_RUNTIME_ANCHORS,
    },
    ...contentOnlyIds.map(contentOnlyScreenCheck),
    ...listTourRuntimeTaskChecks(),
  ];
}
