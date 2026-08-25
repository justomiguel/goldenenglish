// REGRESSION CHECK: nested admin routes (e.g. academic vs academic/contents) must not double-highlight.
import { describe, expect, it } from "vitest";
import { isAdminSidebarNavItemActive, navHrefPathPrefix } from "@/lib/dashboard/adminSidebarNavActive";

const base = "/en/dashboard/admin";
const profile = "/en/dashboard/profile";

const academicHub = `${base}/academic`;
const contents = `${base}/academic/contents`;

const students = `${base}/students`;
const teachers = `${base}/teachers`;
const institute = `${base}/institute`;
const dailyHrefs = [
  base,
  students,
  teachers,
  `${base}/registrations`,
  academicHub,
  `${base}/finance`,
  `${base}/messages`,
  institute,
] as const;

describe("adminSidebarNavActive", () => {
  it("strips query from href for prefix length and matching", () => {
    expect(navHrefPathPrefix(`${base}/finance?tab=overview`)).toBe(`${base}/finance`);
  });

  it("highlights Instituto when pathname is under academic/contents", () => {
    const pathname = `${contents}/global/abc-123`;
    expect(isAdminSidebarNavItemActive(pathname, academicHub, base, profile, dailyHrefs)).toBe(false);
    expect(isAdminSidebarNavItemActive(pathname, institute, base, profile, dailyHrefs)).toBe(true);
  });

  it("highlights Hub académico on cohort routes but not Contents", () => {
    const cohortId = "82f70fa1-a723-4406-bc61-42278abba648";
    const pathname = `${base}/academic/${cohortId}`;
    expect(isAdminSidebarNavItemActive(pathname, academicHub, base, profile, dailyHrefs)).toBe(true);
    expect(isAdminSidebarNavItemActive(pathname, institute, base, profile, dailyHrefs)).toBe(false);
  });

  it("highlights exact home only on admin root", () => {
    expect(isAdminSidebarNavItemActive(base, base, base, profile, dailyHrefs)).toBe(true);
    expect(isAdminSidebarNavItemActive(`${base}/students`, base, base, profile, dailyHrefs)).toBe(false);
    expect(isAdminSidebarNavItemActive(`${base}/students`, students, base, profile, dailyHrefs)).toBe(true);
  });

  it("highlights Instituto on /events", () => {
    expect(isAdminSidebarNavItemActive(`${base}/events`, institute, base, profile, dailyHrefs)).toBe(true);
    expect(isAdminSidebarNavItemActive(`${base}/events`, academicHub, base, profile, dailyHrefs)).toBe(false);
  });

  it("highlights Alumnos on a student person record", () => {
    const pathname = `${base}/users/82f70fa1-a723-4406-bc61-42278abba648`;
    expect(
      isAdminSidebarNavItemActive(pathname, students, base, profile, dailyHrefs, {
        personRecordRole: "student",
      }),
    ).toBe(true);
    expect(
      isAdminSidebarNavItemActive(pathname, institute, base, profile, dailyHrefs, {
        personRecordRole: "student",
      }),
    ).toBe(false);
  });

  it("highlights Instituto on a parent person record", () => {
    const pathname = `${base}/users/82f70fa1-a723-4406-bc61-42278abba648`;
    expect(
      isAdminSidebarNavItemActive(pathname, institute, base, profile, dailyHrefs, {
        personRecordRole: "parent",
      }),
    ).toBe(true);
    expect(
      isAdminSidebarNavItemActive(pathname, students, base, profile, dailyHrefs, {
        personRecordRole: "parent",
      }),
    ).toBe(false);
  });
});
