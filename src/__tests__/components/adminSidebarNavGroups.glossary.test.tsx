import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — glossary", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";
  const badgesZero = { newRegistrations: 0, recentInboundMessages: 0 };

  it("does not put glossary on the daily list", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, badgesZero);
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).not.toContain(`${base}/glossary`);
  });
});
