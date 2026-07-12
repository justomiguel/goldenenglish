import type { ContentOnlyStepDef } from "@/lib/admin-tutorials/explainContentOnlyTour";
import type { AdminScreenTourId } from "@/lib/admin-tutorials/screenCatalog";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type ContentOnlyScreenTourId = Exclude<AdminScreenTourId, "admin-home">;

/**
 * Ordered content-only step definitions (intro + regions + closing).
 * Anchors must exist on the matching page shell (rule 33).
 */
export const CONTENT_ONLY_SCREEN_TOUR_DEFS: Record<
  ContentOnlyScreenTourId,
  readonly ContentOnlyStepDef[]
> = {
  "admin-users": [
    { key: "intro", anchor: null },
    { key: "subnav", anchor: ADMIN_TOUR_ANCHORS.usersSubnav, optional: true },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.usersTitle },
    { key: "toolbar", anchor: ADMIN_TOUR_ANCHORS.usersToolbar },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.usersTable },
    { key: "closing", anchor: null },
  ],
  "admin-registrations": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.registrationsTitle },
    { key: "toolbar", anchor: ADMIN_TOUR_ANCHORS.registrationsToolbar },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.registrationsTable },
    { key: "closing", anchor: null },
  ],
  "admin-events": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.eventsTitle },
    { key: "kpis", anchor: ADMIN_TOUR_ANCHORS.eventsKpis, optional: true },
    { key: "createCta", anchor: ADMIN_TOUR_ANCHORS.eventsCreateCta },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.eventsTable },
    { key: "closing", anchor: null },
  ],
  "admin-finance": [
    { key: "intro", anchor: null },
    { key: "header", anchor: ADMIN_TOUR_ANCHORS.financeHeader },
    { key: "tabs", anchor: ADMIN_TOUR_ANCHORS.financeTabs },
    { key: "cohortYear", anchor: ADMIN_TOUR_ANCHORS.financeCohortYear, optional: true },
    { key: "workspace", anchor: ADMIN_TOUR_ANCHORS.financeWorkspace },
    { key: "closing", anchor: null },
  ],
  "admin-academic": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.academicTitle },
    { key: "newCohort", anchor: ADMIN_TOUR_ANCHORS.newCohort },
    { key: "boardTabs", anchor: ADMIN_TOUR_ANCHORS.academicBoardTabs },
    { key: "cohortList", anchor: ADMIN_TOUR_ANCHORS.academicCohortList },
    { key: "closing", anchor: null },
  ],
  "admin-calendar": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.calendarTitle },
    { key: "filters", anchor: ADMIN_TOUR_ANCHORS.calendarFilters, optional: true },
    { key: "schedule", anchor: ADMIN_TOUR_ANCHORS.calendarSchedule },
    { key: "closing", anchor: null },
  ],
  "admin-contents": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.contentsTitle },
    { key: "tabs", anchor: ADMIN_TOUR_ANCHORS.contentsTabs },
    { key: "workspace", anchor: ADMIN_TOUR_ANCHORS.contentsWorkspace },
    { key: "closing", anchor: null },
  ],
  "admin-badges": [
    { key: "intro", anchor: null },
    { key: "header", anchor: ADMIN_TOUR_ANCHORS.badgesHeader },
    { key: "createCta", anchor: ADMIN_TOUR_ANCHORS.badgesCreateCta },
    { key: "categoryTabs", anchor: ADMIN_TOUR_ANCHORS.badgesCategoryTabs },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.badgesTable },
    { key: "closing", anchor: null },
  ],
  "admin-coupons": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.couponsTitle },
    { key: "createForm", anchor: ADMIN_TOUR_ANCHORS.couponsCreateForm },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.couponsTable },
    { key: "closing", anchor: null },
  ],
  "admin-promotions": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.promotionsTitle },
    { key: "createForm", anchor: ADMIN_TOUR_ANCHORS.promotionsCreateForm },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.promotionsTable },
    { key: "closing", anchor: null },
  ],
  "admin-messages": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.messagesTitle },
    { key: "composeCta", anchor: ADMIN_TOUR_ANCHORS.messagesComposeCta },
    { key: "tabs", anchor: ADMIN_TOUR_ANCHORS.messagesTabs },
    { key: "list", anchor: ADMIN_TOUR_ANCHORS.messagesList },
    { key: "closing", anchor: null },
  ],
  "admin-email-templates": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.emailTemplatesTitle },
    { key: "select", anchor: ADMIN_TOUR_ANCHORS.emailTemplatesSelect },
    { key: "editor", anchor: ADMIN_TOUR_ANCHORS.emailTemplatesEditor },
    { key: "preview", anchor: ADMIN_TOUR_ANCHORS.emailTemplatesPreview },
    { key: "closing", anchor: null },
  ],
  "admin-blog": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.blogTitle },
    { key: "createCta", anchor: ADMIN_TOUR_ANCHORS.blogCreateCta },
    { key: "articleList", anchor: ADMIN_TOUR_ANCHORS.blogArticleList },
    { key: "closing", anchor: null },
  ],
  "admin-glossary": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.glossaryTitle },
    { key: "hierarchy", anchor: ADMIN_TOUR_ANCHORS.glossaryHierarchy },
    { key: "groups", anchor: ADMIN_TOUR_ANCHORS.glossaryGroups },
    { key: "closing", anchor: null },
  ],
  "admin-analytics": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.analyticsTitle },
    { key: "traffic", anchor: ADMIN_TOUR_ANCHORS.analyticsTraffic },
    { key: "charts", anchor: ADMIN_TOUR_ANCHORS.analyticsCharts },
    { key: "closing", anchor: null },
  ],
  "admin-audit": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.auditTitle },
    { key: "toolbar", anchor: ADMIN_TOUR_ANCHORS.auditToolbar },
    { key: "table", anchor: ADMIN_TOUR_ANCHORS.auditTable },
    { key: "closing", anchor: null },
  ],
  "admin-cms": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.cmsTitle },
    { key: "templatesCard", anchor: ADMIN_TOUR_ANCHORS.cmsTemplatesCard },
    { key: "blogCard", anchor: ADMIN_TOUR_ANCHORS.cmsBlogCard, optional: true },
    { key: "closing", anchor: null },
  ],
  "admin-site-setup": [
    { key: "intro", anchor: null },
    { key: "stepIndicator", anchor: ADMIN_TOUR_ANCHORS.siteSetupStepIndicator },
    { key: "panel", anchor: ADMIN_TOUR_ANCHORS.siteSetupPanel },
    { key: "nav", anchor: ADMIN_TOUR_ANCHORS.siteSetupNav },
    { key: "closing", anchor: null },
  ],
  "admin-settings": [
    { key: "intro", anchor: null },
    { key: "titleBlock", anchor: ADMIN_TOUR_ANCHORS.settingsTitle },
    { key: "inscriptions", anchor: ADMIN_TOUR_ANCHORS.settingsInscriptions },
    { key: "classReminders", anchor: ADMIN_TOUR_ANCHORS.settingsClassReminders },
    { key: "blogTranslate", anchor: ADMIN_TOUR_ANCHORS.settingsBlogTranslate, optional: true },
    { key: "closing", anchor: null },
  ],
  "admin-profile": [
    { key: "intro", anchor: null },
    { key: "header", anchor: ADMIN_TOUR_ANCHORS.profileHeader },
    { key: "avatar", anchor: ADMIN_TOUR_ANCHORS.profileAvatar },
    { key: "personalForm", anchor: ADMIN_TOUR_ANCHORS.profilePersonalForm },
    { key: "password", anchor: ADMIN_TOUR_ANCHORS.profilePassword, optional: true },
    { key: "closing", anchor: null },
  ],
};

export function getContentOnlyScreenTourDefs(
  id: ContentOnlyScreenTourId,
): readonly ContentOnlyStepDef[] {
  return CONTENT_ONLY_SCREEN_TOUR_DEFS[id];
}
