import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — glossary", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";
  const badgesZero = { newRegistrations: 0, recentInboundMessages: 0 };

  it("includes glossary under the Help group", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero);
    const helpGroup = groups.find((g) => g.label === dictEn.dashboard.adminNav.groupHelp);
    expect(helpGroup).toBeDefined();
    const glossaryItem = helpGroup?.items.find((i) => i.href === `${base}/glossary`);
    expect(glossaryItem?.label).toBe(dictEn.dashboard.adminNav.glossary);
  });
});
