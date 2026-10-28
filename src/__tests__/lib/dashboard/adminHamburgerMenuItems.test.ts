import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { buildAdminHamburgerMenuItems } from "@/lib/dashboard/adminHamburgerMenuItems";

const base = "/es/dashboard/admin";
const nav = dictEn.dashboard.adminNav;
const badges = { newRegistrations: 2, recentInboundMessages: 4 };

function labels(query = "", includeBlogNav = false) {
  return buildAdminHamburgerMenuItems(base, nav, badges, {
    financeHref: `${base}/finance`,
    includeBlogNav,
    query,
  }).map((item) => item.label);
}

describe("buildAdminHamburgerMenuItems", () => {
  it("drops the four destinations that already sit on the bottom bar", () => {
    const result = labels();
    expect(result).not.toContain(nav.home);
    expect(result).not.toContain(nav.students);
    expect(result).not.toContain(nav.registrations);
    expect(result).not.toContain(nav.finance);
    expect(result).toEqual([
      nav.parents,
      nav.teachers,
      nav.users,
      nav.messages,
      nav.academics,
      nav.events,
      nav.institute,
    ]);
  });

  it("keeps the unread message count on the messages tile", () => {
    const messages = buildAdminHamburgerMenuItems(base, nav, badges, {
      financeHref: `${base}/finance`,
    }).find((item) => item.href === `${base}/messages`);
    expect(messages?.badge).toBe(4);
  });

  it("adds blog only when the flag is on", () => {
    expect(labels()).not.toContain(nav.blog);
    expect(labels("", true)).toContain(nav.blog);
  });

  it("matches a label without caring about case", () => {
    expect(labels("PARENTS")).toEqual([nav.parents]);
    expect(labels("zzz")).toEqual([]);
  });
});
