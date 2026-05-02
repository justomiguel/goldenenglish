import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — email templates mega-admin flag", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";

  it("hides Communications → Email templates by default", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, 0);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain(`${base}/communications/templates`);
  });

  it("shows Communications → Email templates when includeEmailTemplatesNav", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, 0, {
      includeEmailTemplatesNav: true,
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(`${base}/communications/templates`);
  });
});
