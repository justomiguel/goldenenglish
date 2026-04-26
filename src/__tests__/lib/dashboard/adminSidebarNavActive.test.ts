// REGRESSION CHECK: nested admin routes (e.g. academic vs academic/contents) must not double-highlight.
import { describe, expect, it } from "vitest";
import { isAdminSidebarNavItemActive, navHrefPathPrefix } from "@/lib/dashboard/adminSidebarNavActive";

const base = "/en/dashboard/admin";
const profile = "/en/dashboard/profile";

const academicHub = `${base}/academic`;
const contents = `${base}/academic/contents`;
const users = `${base}/users`;

const sampleHrefs = [base, users, academicHub, `${base}/calendar`, contents, `${base}/settings`, profile] as const;

describe("adminSidebarNavActive", () => {
  it("strips query from href for prefix length and matching", () => {
    expect(navHrefPathPrefix(`${base}/finance?tab=overview`)).toBe(`${base}/finance`);
  });

  it("highlights only Contents when pathname is under academic/contents", () => {
    const pathname = `${contents}/global/abc-123`;
    expect(isAdminSidebarNavItemActive(pathname, academicHub, base, profile, sampleHrefs)).toBe(false);
    expect(isAdminSidebarNavItemActive(pathname, contents, base, profile, sampleHrefs)).toBe(true);
  });

  it("highlights Hub académico on cohort routes but not Contents", () => {
    const cohortId = "82f70fa1-a723-4406-bc61-42278abba648";
    const pathname = `${base}/academic/${cohortId}`;
    expect(isAdminSidebarNavItemActive(pathname, academicHub, base, profile, sampleHrefs)).toBe(true);
    expect(isAdminSidebarNavItemActive(pathname, contents, base, profile, sampleHrefs)).toBe(false);
  });

  it("highlights exact home only on admin root", () => {
    expect(isAdminSidebarNavItemActive(base, base, base, profile, sampleHrefs)).toBe(true);
    expect(isAdminSidebarNavItemActive(`${base}/users`, base, base, profile, sampleHrefs)).toBe(false);
    expect(isAdminSidebarNavItemActive(`${base}/users`, users, base, profile, sampleHrefs)).toBe(true);
  });
});
