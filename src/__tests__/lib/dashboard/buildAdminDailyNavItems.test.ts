import { describe, expect, it } from "vitest";
import { buildAdminDailyNavItems } from "@/lib/dashboard/buildAdminDailyNavItems";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/admin";

function hrefs(opts?: Parameters<typeof buildAdminDailyNavItems>[3]) {
  return buildAdminDailyNavItems(
    BASE,
    dictEn.dashboard.adminNav,
    {
      newRegistrations: 4,
      recentInboundMessages: 2,
    },
    opts,
  ).map((i) => i.href);
}

describe("buildAdminDailyNavItems", () => {
  it("returns the daily hrefs in spec order", () => {
    expect(hrefs()).toEqual([
      BASE,
      `${BASE}/students`,
      `${BASE}/parents`,
      `${BASE}/teachers`,
      `${BASE}/users`,
      `${BASE}/registrations`,
      `${BASE}/messages`,
      `${BASE}/academic`,
      `${BASE}/finance`,
      `${BASE}/events`,
      `${BASE}/institute`,
    ]);
  });

  it("lists blog after events when includeBlogNav", () => {
    expect(hrefs({ includeBlogNav: true })).toEqual([
      BASE,
      `${BASE}/students`,
      `${BASE}/parents`,
      `${BASE}/teachers`,
      `${BASE}/users`,
      `${BASE}/registrations`,
      `${BASE}/messages`,
      `${BASE}/academic`,
      `${BASE}/finance`,
      `${BASE}/events`,
      `${BASE}/cms/blog`,
      `${BASE}/institute`,
    ]);
  });

  it("lists merch after events when includeMerchNav", () => {
    expect(hrefs({ includeMerchNav: true })).toEqual([
      BASE,
      `${BASE}/students`,
      `${BASE}/parents`,
      `${BASE}/teachers`,
      `${BASE}/users`,
      `${BASE}/registrations`,
      `${BASE}/messages`,
      `${BASE}/academic`,
      `${BASE}/finance`,
      `${BASE}/events`,
      `${BASE}/merch`,
      `${BASE}/institute`,
    ]);
  });

  it("lists blog then merch when both flags", () => {
    expect(hrefs({ includeBlogNav: true, includeMerchNav: true }).slice(-3)).toEqual([
      `${BASE}/cms/blog`,
      `${BASE}/merch`,
      `${BASE}/institute`,
    ]);
  });

  it("keeps the registration badge and lists messages with the inbox count", () => {
    const items = buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
      newRegistrations: 4,
      recentInboundMessages: 2,
    });
    expect(items.find((i) => i.href.endsWith("/registrations"))?.badge).toBe(4);
    const messages = items.find((i) => i.href.endsWith("/messages"));
    expect(messages?.badge).toBe(2);
    expect(messages?.iconId).toBe("messages");
    expect(messages?.label).toBe(dictEn.dashboard.adminNav.messages);
  });

  it("puts admin-nav-users on Alumnos and admin-nav-academic on Cohortes", () => {
    const items = buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
      newRegistrations: 0,
      recentInboundMessages: 0,
    });
    expect(items.find((i) => i.href.endsWith("/students"))?.tourId).toBe("admin-nav-users");
    expect(items.find((i) => i.href.endsWith("/academic"))?.tourId).toBe("admin-nav-academic");
  });

  it("does not list glossary or email templates on the daily rail", () => {
    const set = new Set(hrefs({ includeBlogNav: true }));
    expect(set.has(`${BASE}/glossary`)).toBe(false);
    expect(set.has(`${BASE}/communications/templates`)).toBe(false);
  });

  it("uses the shared surface icon ids", () => {
    const items = buildAdminDailyNavItems(BASE, dictEn.dashboard.adminNav, {
      newRegistrations: 0,
      recentInboundMessages: 0,
    });
    expect(items.map((i) => i.iconId)).toEqual([
      "home",
      "students",
      "parents",
      "teachers",
      "allAccounts",
      "registrations",
      "messages",
      "academic",
      "finance",
      "events",
      "institute",
    ]);
  });

  it("honours financeHref", () => {
    const custom = `${BASE}/finance?tab=collections&cohort=abc`;
    expect(hrefs({ financeHref: custom })).toContain(custom);
  });
});
