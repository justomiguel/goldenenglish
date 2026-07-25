// REGRESSION CHECK: Path matching for screen explain tours must stay exact —
// nested /admin/* routes must not inherit parent tours; contents ≠ academic.
import { describe, expect, it } from "vitest";
import {
  adminHomePath,
  adminProfilePath,
  adminScreenPath,
  isAdminHomePath,
  listAdminScreenTourIds,
  listAdminScreenTourMetaKeys,
  resolveAdminScreenTour,
} from "@/lib/admin-tutorials/screenCatalog";

describe("admin-tutorials screenCatalog", () => {
  it("builds admin home path", () => {
    expect(adminHomePath("es")).toBe("/es/dashboard/admin");
  });

  it("matches admin home exactly (optional trailing slash)", () => {
    expect(isAdminHomePath("/es/dashboard/admin", "es")).toBe(true);
    expect(isAdminHomePath("/es/dashboard/admin/", "es")).toBe(true);
    expect(isAdminHomePath("/en/dashboard/admin", "en")).toBe(true);
  });

  it("does not match nested admin routes as home", () => {
    expect(isAdminHomePath("/es/dashboard/admin/users", "es")).toBe(false);
    expect(isAdminHomePath("/es/dashboard/admin/academic", "es")).toBe(false);
  });

  it("resolves admin-home with chrome-and-content scope", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin", "es")).toEqual({
      id: "admin-home",
      scope: "chrome-and-content",
      metaKey: "adminHome",
    });
  });

  it("resolves users list and nested create/import routes", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/users", "es")).toEqual({
      id: "admin-users",
      scope: "content-only",
      metaKey: "adminUsers",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/users/new", "es")).toEqual({
      id: "admin-users-new",
      scope: "content-only",
      metaKey: "adminUsersNew",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/users/import", "es")).toEqual({
      id: "admin-users-import",
      scope: "content-only",
      metaKey: "adminUsersImport",
    });
  });

  it("resolves user detail and billing routes", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/users/u1", "es")).toEqual({
      id: "admin-user-detail",
      scope: "content-only",
      metaKey: "adminUserDetail",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/users/u1/billing", "es")).toEqual({
      id: "admin-user-billing",
      scope: "content-only",
      metaKey: "adminUserBilling",
    });
  });

  it("resolves events list, new, and detail routes", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/events", "es")?.id).toBe("admin-events");
    expect(resolveAdminScreenTour("/es/dashboard/admin/events/new", "es")).toEqual({
      id: "admin-events-new",
      scope: "content-only",
      metaKey: "adminEventsNew",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/events/ev-1", "es")).toEqual({
      id: "admin-event-detail",
      scope: "content-only",
      metaKey: "adminEventDetail",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/events/ev-1?tab=payments", "es")?.id).toBe(
      "admin-event-detail",
    );
  });

  it("resolves blog list, new, and edit routes", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/cms/blog", "es")?.id).toBe("admin-blog");
    expect(resolveAdminScreenTour("/es/dashboard/admin/cms/blog/new", "es")).toEqual({
      id: "admin-blog-new",
      scope: "content-only",
      metaKey: "adminBlogNew",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/cms/blog/a1/edit", "es")).toEqual({
      id: "admin-blog-edit",
      scope: "content-only",
      metaKey: "adminBlogEdit",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/cms/blog/comments", "es")).toBeNull();
  });

  it("resolves messages list, compose, and detail routes", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/messages", "es")?.id).toBe("admin-messages");
    expect(resolveAdminScreenTour("/es/dashboard/admin/messages/compose", "es")).toEqual({
      id: "admin-messages-compose",
      scope: "content-only",
      metaKey: "adminMessagesCompose",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/messages/msg-1", "es")).toEqual({
      id: "admin-message-detail",
      scope: "content-only",
      metaKey: "adminMessageDetail",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/messages/compose?replyTo=x", "es")?.id).toBe(
      "admin-messages-compose",
    );
  });

  it("disambiguates academic contents vs academic hub", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic", "es")?.id).toBe(
      "admin-academic",
    );
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic/contents", "es")?.id).toBe(
      "admin-contents",
    );
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic/cohort-1", "es")).toEqual({
      id: "admin-cohort-detail",
      scope: "content-only",
      metaKey: "adminCohortDetail",
    });
    expect(
      resolveAdminScreenTour("/es/dashboard/admin/academic/cohort-1/section-1/attendance", "es"),
    ).toEqual({
      id: "admin-section-attendance",
      scope: "content-only",
      metaKey: "adminSectionAttendance",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic/cohort-1/section-1", "es")).toEqual({
      id: "admin-section-detail",
      scope: "content-only",
      metaKey: "adminSectionDetail",
    });
  });

  it("resolves finance drill-down routes", () => {
    expect(
      resolveAdminScreenTour("/es/dashboard/admin/finance/collections/sec-1", "es"),
    ).toEqual({
      id: "admin-finance-collections-section",
      scope: "content-only",
      metaKey: "adminFinanceCollectionsSection",
    });
    expect(
      resolveAdminScreenTour("/es/dashboard/admin/finance/receipts/rec-1", "es"),
    ).toEqual({
      id: "admin-finance-receipt-detail",
      scope: "content-only",
      metaKey: "adminFinanceReceiptDetail",
    });
  });

  it("resolves settings integrations as content-only", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/settings/integrations", "es")).toEqual({
      id: "admin-settings-integrations",
      scope: "content-only",
      metaKey: "adminSettingsIntegrations",
    });
  });

  it("matches finance ignoring query string", () => {
    expect(
      resolveAdminScreenTour(
        "/es/dashboard/admin/finance?tab=collections&cohort=x",
        "es",
      )?.id,
    ).toBe("admin-finance");
  });

  it("resolves profile path as content-only", () => {
    expect(adminProfilePath("en")).toBe("/en/dashboard/profile");
    expect(resolveAdminScreenTour("/en/dashboard/profile", "en")).toEqual({
      id: "admin-profile",
      scope: "content-only",
      metaKey: "adminProfile",
    });
  });

  it("resolves every sidebar content route via adminScreenPath", () => {
    const ids = [
      "admin-users",
      "admin-registrations",
      "admin-events",
      "admin-finance",
      "admin-academic",
      "admin-calendar",
      "admin-contents",
      "admin-badges",
      "admin-coupons",
      "admin-promotions",
      "admin-messages",
      "admin-email-templates",
      "admin-blog",
      "admin-glossary",
      "admin-analytics",
      "admin-audit",
      "admin-cms",
      "admin-site-setup",
      "admin-settings",
    ] as const;
    for (const id of ids) {
      const path = adminScreenPath("pt", id);
      const match = resolveAdminScreenTour(path, "pt");
      expect(match?.id, id).toBe(id);
      expect(match?.scope).toBe("content-only");
    }
  });

  it("lists all meta keys including home and profile", () => {
    const keys = listAdminScreenTourMetaKeys();
    expect(keys).toContain("adminHome");
    expect(keys).toContain("adminUsers");
    expect(keys).toContain("adminProfile");
    expect(keys.length).toBeGreaterThanOrEqual(25);
  });

  it("lists every screen tour id for the L3 matrix contract", () => {
    const ids = listAdminScreenTourIds();
    expect(ids).toContain("admin-home");
    expect(ids).toContain("admin-users");
    expect(ids).toContain("admin-profile");
    expect(ids).toContain("admin-section-detail");
    expect(ids).toContain("admin-settings-integrations");
    expect(ids).toContain("admin-finance-collections-section");
    expect(ids).toContain("admin-finance-receipt-detail");
    expect(ids.length).toBe(listAdminScreenTourMetaKeys().length);
  });
});
