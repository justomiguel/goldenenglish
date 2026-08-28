import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — email templates and blog stay off the daily list", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";
  const badgesZero = { newRegistrations: 0, recentInboundMessages: 0 };

  it("does not list email templates even when includeEmailTemplatesNav", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero, {
      includeEmailTemplatesNav: true,
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain(`${base}/communications/templates`);
  });

  it("lists blog when includeBlogNav", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero, {
      includeBlogNav: true,
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(`${base}/cms/blog`);
  });

  it("omits blog when includeBlogNav is off", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain(`${base}/cms/blog`);
    expect(hrefs).toContain(`${base}/events`);
  });
});
