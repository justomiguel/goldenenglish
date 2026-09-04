import { describe, expect, it } from "vitest";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { dictEn } from "@/test/dictEn";

describe("buildAdminSidebarNavGroups — badges", () => {
  const base = "/en/dashboard/admin";
  const profile = "/en/dashboard/profile";

  it("does not list Messages on the daily rail", () => {
    const groups = buildAdminSidebarNavGroups(base, profile, dictEn.dashboard.adminNav, {
      newRegistrations: 0,
      recentInboundMessages: 7,
    });
    const messagesItem = groups.flatMap((g) => g.items).find((i) => i.href === `${base}/messages`);
    expect(messagesItem).toBeUndefined();
  });
});
