// REGRESSION CHECK: Every content-only screen tour def key must exist in en dictionary steps.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_ONLY_SCREEN_TOUR_DEFS } from "@/lib/admin-tutorials/screenTourDefs";
import {
  listAdminScreenTourMetaKeys,
  type AdminScreenTourId,
  type AdminScreenTourMetaKey,
} from "@/lib/admin-tutorials/screenCatalog";

const ID_TO_META: Record<Exclude<AdminScreenTourId, "admin-home">, AdminScreenTourMetaKey> = {
  "admin-users": "adminUsers",
  "admin-users-new": "adminUsersNew",
  "admin-users-import": "adminUsersImport",
  "admin-user-detail": "adminUserDetail",
  "admin-user-billing": "adminUserBilling",
  "admin-registrations": "adminRegistrations",
  "admin-events": "adminEvents",
  "admin-events-new": "adminEventsNew",
  "admin-event-detail": "adminEventDetail",
  "admin-finance": "adminFinance",
  "admin-finance-collections-section": "adminFinanceCollectionsSection",
  "admin-finance-receipt-detail": "adminFinanceReceiptDetail",
  "admin-academic": "adminAcademic",
  "admin-cohort-detail": "adminCohortDetail",
  "admin-section-attendance": "adminSectionAttendance",
  "admin-section-detail": "adminSectionDetail",
  "admin-calendar": "adminCalendar",
  "admin-contents": "adminContents",
  "admin-badges": "adminBadges",
  "admin-coupons": "adminCoupons",
  "admin-promotions": "adminPromotions",
  "admin-messages": "adminMessages",
  "admin-messages-compose": "adminMessagesCompose",
  "admin-message-detail": "adminMessageDetail",
  "admin-email-templates": "adminEmailTemplates",
  "admin-blog": "adminBlog",
  "admin-blog-new": "adminBlogNew",
  "admin-blog-edit": "adminBlogEdit",
  "admin-glossary": "adminGlossary",
  "admin-analytics": "adminAnalytics",
  "admin-audit": "adminAudit",
  "admin-cms": "adminCms",
  "admin-site-setup": "adminSiteSetup",
  "admin-settings": "adminSettings",
  "admin-settings-integrations": "adminSettingsIntegrations",
  "admin-profile": "adminProfile",
};

describe("screenTourDefs ↔ dictionary steps", () => {
  it("en.json has a step for every content-only def key", () => {
    const en = JSON.parse(
      readFileSync(join(process.cwd(), "src/dictionaries/en.json"), "utf8"),
    ) as {
      dashboard: {
        adminHelpScreenTours: Record<string, { steps?: Record<string, unknown> }>;
      };
    };
    const tours = en.dashboard.adminHelpScreenTours;
    for (const metaKey of listAdminScreenTourMetaKeys()) {
      if (metaKey === "adminHome") continue;
      expect(tours[metaKey]?.steps, metaKey).toBeTruthy();
    }
    for (const [id, defs] of Object.entries(CONTENT_ONLY_SCREEN_TOUR_DEFS)) {
      const metaKey = ID_TO_META[id as keyof typeof ID_TO_META];
      const steps = tours[metaKey]?.steps ?? {};
      for (const def of defs) {
        expect(steps[def.key], `${metaKey}.steps.${def.key}`).toBeTruthy();
      }
    }
  });
});
