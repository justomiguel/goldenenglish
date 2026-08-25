import { describe, expect, it } from "vitest";
import {
  ADMIN_PAGE_HEADER_ART_FAMILIES,
  adminPageHeaderArtFamily,
  adminPageHeaderArtSrc,
} from "@/lib/dashboard/adminPageHeaderArt";
import { ADMIN_SURFACE_ICON_IDS } from "@/lib/dashboard/adminSurfaceIcon";

describe("adminPageHeaderArt", () => {
  it("gives each sidebar destination its own family", () => {
    const families = [
      adminPageHeaderArtFamily("students"),
      adminPageHeaderArtFamily("teachers"),
      adminPageHeaderArtFamily("registrations"),
      adminPageHeaderArtFamily("academic"),
      adminPageHeaderArtFamily("finance"),
      adminPageHeaderArtFamily("messages"),
      adminPageHeaderArtFamily("institute"),
    ];
    expect(new Set(families).size).toBe(7);
    expect(ADMIN_PAGE_HEADER_ART_FAMILIES).toEqual(
      expect.arrayContaining(["parent", "student", "staff"]),
    );
    expect(adminPageHeaderArtSrc("students")).toBe("/images/dashboard/admin-hero-students.webp");
    expect(adminPageHeaderArtSrc("teachers")).toBe("/images/dashboard/admin-hero-teachers.webp");
  });

  it("maps every surface icon to a family, and no icon to none", () => {
    for (const id of ADMIN_SURFACE_ICON_IDS) {
      expect(adminPageHeaderArtFamily(id)).not.toBeNull();
    }
    expect(adminPageHeaderArtSrc()).toBeNull();
  });
});
