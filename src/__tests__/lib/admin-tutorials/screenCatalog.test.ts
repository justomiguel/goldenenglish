// REGRESSION CHECK: Path matching for screen explain tours must stay exact —
// nested /admin/* routes must not inherit parent tours; contents ≠ academic.
import { describe, expect, it } from "vitest";
import {
  adminHomePath,
  adminProfilePath,
  adminScreenPath,
  isAdminHomePath,
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

  it("resolves users and ignores nested user detail", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/users", "es")).toEqual({
      id: "admin-users",
      scope: "content-only",
      metaKey: "adminUsers",
    });
    expect(resolveAdminScreenTour("/es/dashboard/admin/users/abc", "es")).toBeNull();
  });

  it("disambiguates academic contents vs academic hub", () => {
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic", "es")?.id).toBe(
      "admin-academic",
    );
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic/contents", "es")?.id).toBe(
      "admin-contents",
    );
    expect(resolveAdminScreenTour("/es/dashboard/admin/academic/cohort-1", "es")).toBeNull();
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
    expect(keys.length).toBeGreaterThanOrEqual(21);
  });
});
