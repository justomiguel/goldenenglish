import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import type { AdminTourAnchor } from "@/lib/admin-tutorials/selectors";

export function eventsNewPath(locale: string): string {
  return `/${locale}/dashboard/admin/events/new`;
}

export function isEventsNewPath(pathname: string, locale: string): boolean {
  const base = eventsNewPath(locale);
  return pathname === base || pathname === `${base}/`;
}

export function financeInboxPath(locale: string): string {
  return `/${locale}/dashboard/admin/finance?tab=inbox`;
}

export function isFinanceInboxPath(pathname: string, locale: string): boolean {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  const base = `/${locale}/dashboard/admin/finance`;
  return pathOnly === base || pathOnly === `${base}/`;
}

export function financeSettingsPath(locale: string): string {
  return `/${locale}/dashboard/admin/finance?tab=settings`;
}

/** True only when already on finance and the browser search says Settings. */
export function isFinanceSettingsPath(pathname: string, locale: string): boolean {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  const base = `/${locale}/dashboard/admin/finance`;
  if (pathOnly !== base && pathOnly !== `${base}/`) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tab") === "settings";
}

export function studentBillingPath(locale: string, studentId: string): string {
  return `/${locale}/dashboard/admin/users/${studentId}/billing`;
}

export function studentDetailPath(locale: string, userId: string): string {
  return `/${locale}/dashboard/admin/users/${userId}`;
}

export function academicSectionAttendancePath(
  locale: string,
  cohortId: string,
  sectionId: string,
): string {
  return `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}/attendance`;
}

export function blogNewPath(locale: string): string {
  return `/${locale}/dashboard/admin/cms/blog/new`;
}

export function isBlogNewPath(pathname: string, locale: string): boolean {
  const base = blogNewPath(locale);
  return pathname === base || pathname === `${base}/`;
}

export function usersImportPath(locale: string): string {
  return `/${locale}/dashboard/admin/users/import`;
}

export function isUsersImportPath(pathname: string, locale: string): boolean {
  const base = usersImportPath(locale);
  return pathname === base || pathname === `${base}/`;
}

export function siteSetupPath(locale: string): string {
  return `/${locale}/dashboard/admin/site-setup`;
}

export function isSiteSetupPath(pathname: string, locale: string): boolean {
  const base = siteSetupPath(locale);
  const pathOnly = pathname.split("?")[0] ?? pathname;
  return pathOnly === base || pathOnly === `${base}/`;
}

export function sectionCollectionsPath(locale: string, sectionId: string): string {
  return `/${locale}/dashboard/admin/finance/collections/${sectionId}`;
}

export function isSectionCollectionsPath(
  pathname: string,
  locale: string,
  sectionId: string,
): boolean {
  const base = sectionCollectionsPath(locale, sectionId);
  const pathOnly = pathname.split("?")[0] ?? pathname;
  return pathOnly === base || pathOnly === `${base}/`;
}

export function eventPaymentsPath(locale: string, eventId: string): string {
  return `/${locale}/dashboard/admin/events/${eventId}?tab=payments`;
}

export function isEventPaymentsPath(
  pathname: string,
  locale: string,
  eventId: string,
): boolean {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  const base = `/${locale}/dashboard/admin/events/${eventId}`;
  if (pathOnly !== base && pathOnly !== `${base}/`) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("tab") === "payments";
}

/** Preferred wait anchor for site setup wizard shell. */
export const SITE_SETUP_WAIT_ANCHOR: AdminTourAnchor = ADMIN_TOUR_ANCHORS.siteSetupPanel;

/** Preferred wait anchor for section collections workspace. */
export const SECTION_COLLECTIONS_WAIT_ANCHOR: AdminTourAnchor =
  ADMIN_TOUR_ANCHORS.sectionCollectionsRoot;

/** Preferred wait anchor for event payments tab content. */
export const EVENT_PAYMENTS_WAIT_ANCHOR: AdminTourAnchor = ADMIN_TOUR_ANCHORS.eventPaymentsPanel;

/** Preferred wait anchor for finance inbox (root always present when panel mounts). */
export const FINANCE_INBOX_WAIT_ANCHOR: AdminTourAnchor = ADMIN_TOUR_ANCHORS.financeInboxRoot;

/** Preferred wait anchor for finance settings panel. */
export const FINANCE_SETTINGS_WAIT_ANCHOR: AdminTourAnchor =
  ADMIN_TOUR_ANCHORS.financeSettingsRoot;
