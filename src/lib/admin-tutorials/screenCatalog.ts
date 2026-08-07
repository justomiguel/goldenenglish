/**
 * Contextual “explain this screen” catalog.
 * Hub home is the only tour with chrome + content; all others are content-only.
 */

export type {
  AdminScreenTourId,
  AdminScreenTourScope,
  AdminScreenTourMetaKey,
  AdminScreenTourMatch,
} from "@/lib/admin-tutorials/screenCatalogTypes";

export {
  adminHomePath,
  adminProfilePath,
  isAdminHomePath,
  listAdminScreenTourMetaKeys,
  listAdminScreenTourIds,
  cohortDetailPath,
  sectionAttendanceScreenPath,
  sectionDetailScreenPath,
  financeCollectionsSectionPath,
  financeReceiptDetailPath,
  blogArticleEditPath,
  eventDetailPath,
  messageDetailPath,
  userDetailPath,
  userBillingPath,
  adminScreenPath,
} from "@/lib/admin-tutorials/screenCatalogRoutes";

export { resolveAdminScreenTour } from "@/lib/admin-tutorials/resolveAdminScreenTour";
