import { describe, expect, it } from "vitest";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import {
  EXCLUSIVE_THEME_OWNERS,
  SHARED_THEME_KINDS,
  canTenantUseThemeKind,
  isExclusiveThemeKind,
  themeKindsForTenant,
} from "@/lib/theme/exclusiveThemeKinds";
import { SITE_THEME_KINDS, type SiteThemeKind } from "@/types/theming";

// REGRESSION CHECK: A bespoke SiteThemeKind without an owner row must fail this file.
// Catalog kinds and classic/editorial/minimal stay available to every tenant.

describe("exclusiveThemeKinds", () => {
  it("lets the owner use the theme and blocks every other tenant", () => {
    expect(canTenantUseThemeKind("mozarthitos", "mozarthitos")).toBe(true);
    expect(canTenantUseThemeKind("mozarthitos", "nago")).toBe(false);
    expect(canTenantUseThemeKind("nago", "nago")).toBe(true);
    expect(canTenantUseThemeKind("liora", "mimundo")).toBe(false);
  });

  it("allows every tenant when the request has no tenant", () => {
    expect(canTenantUseThemeKind("espaciozenit", null)).toBe(true);
  });

  it("allows catalog and shared kinds for any tenant", () => {
    expect(canTenantUseThemeKind("deportes", "nago")).toBe(true);
    expect(canTenantUseThemeKind("classic", "liora")).toBe(true);
    expect(canTenantUseThemeKind("editorial", "golden")).toBe(true);
    expect(canTenantUseThemeKind("minimal", null)).toBe(true);
  });

  it("keeps the current kind visible even when the tenant does not own it", () => {
    const kinds = themeKindsForTenant("nago", "mozarthitos");
    expect(kinds[0]).toBe("mozarthitos");
    expect(kinds).toContain("nago");
    expect(kinds).toContain("classic");
    expect(kinds.filter((kind) => kind === "espaciozenit")).toEqual([]);
  });

  it("classifies every site theme kind once", () => {
    for (const kind of SITE_THEME_KINDS) {
      const flags = [
        (SHARED_THEME_KINDS as readonly string[]).includes(kind),
        (GENERIC_INSTITUTE_KINDS as readonly string[]).includes(kind),
        isExclusiveThemeKind(kind),
      ].filter(Boolean);
      expect(flags).toHaveLength(1);
    }
  });

  it("keeps exclusive kinds out of the client catalog", () => {
    for (const kind of Object.keys(EXCLUSIVE_THEME_OWNERS) as SiteThemeKind[]) {
      expect(SITE_THEME_KINDS).toContain(kind);
      expect(GENERIC_INSTITUTE_KINDS as readonly string[]).not.toContain(kind);
    }
  });
});
