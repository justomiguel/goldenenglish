import { describe, expect, it } from "vitest";
import { buildAdminInstituteHubGroups } from "@/lib/dashboard/buildAdminInstituteHubGroups";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/admin";

function rowsFor(
  id: "academic" | "growth" | "site" | "dataHelp",
  opts?: Parameters<typeof buildAdminInstituteHubGroups>[2],
) {
  const groups = buildAdminInstituteHubGroups(BASE, dictEn.dashboard.adminNav, opts ?? {});
  return groups.find((g) => g.id === id)?.rows.map((r) => r.href) ?? [];
}

describe("buildAdminInstituteHubGroups", () => {
  it("returns the four groups in spec order", () => {
    const ids = buildAdminInstituteHubGroups(BASE, dictEn.dashboard.adminNav, {}).map((g) => g.id);
    expect(ids).toEqual(["academic", "growth", "site", "dataHelp"]);
  });

  it("assigns surface icons to academic extras", () => {
    const rows =
      buildAdminInstituteHubGroups(BASE, dictEn.dashboard.adminNav, {}).find((g) => g.id === "academic")
        ?.rows ?? [];
    expect(rows.map((r) => r.iconId)).toEqual(["calendar", "events", "contents", "badges"]);
  });

  it("lists academic extras", () => {
    expect(rowsFor("academic")).toEqual([
      `${BASE}/calendar`,
      `${BASE}/events`,
      `${BASE}/academic/contents`,
      `${BASE}/badges`,
    ]);
  });

  it("omits blog and email templates by default", () => {
    expect(rowsFor("growth")).toEqual([`${BASE}/coupons`, `${BASE}/promotions`]);
    expect(rowsFor("dataHelp")).toEqual([
      `${BASE}/analytics`,
      `${BASE}/audit`,
      `${BASE}/glossary`,
    ]);
  });

  it("includes blog and email templates when flagged", () => {
    expect(rowsFor("growth", { includeBlogNav: true })).toContain(`${BASE}/cms/blog`);
    expect(rowsFor("dataHelp", { includeEmailTemplatesNav: true })).toContain(
      `${BASE}/communications/templates`,
    );
  });

  it("puts Todas las cuentas on the site group", () => {
    expect(rowsFor("site")).toEqual([
      `${BASE}/cms`,
      `${BASE}/site-setup`,
      `${BASE}/settings`,
      `${BASE}/users`,
    ]);
  });
});
