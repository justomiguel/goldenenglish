import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — email templates mega-admin flag", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";
  const badgesZero = { newRegistrations: 0, recentInboundMessages: 0 };

  it("hides Communications → Email templates by default", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain(`${base}/communications/templates`);
  });

  it("shows Communications → Email templates when includeEmailTemplatesNav", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero, {
      includeEmailTemplatesNav: true,
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(`${base}/communications/templates`);
  });

  it("shows Blog under Communications when includeBlogNav", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero, {
      includeBlogNav: true,
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(`${base}/cms/blog`);
    const commsGroup = groups.find((g) => g.label === dictEn.dashboard.adminNav.groupComms);
    expect(commsGroup?.items.some((item) => item.href === `${base}/cms/blog`)).toBe(true);
  });
});
