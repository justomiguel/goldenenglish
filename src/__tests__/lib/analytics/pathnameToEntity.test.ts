import { describe, it, expect } from "vitest";
import { AnalyticsEntity, pathnameToEntity } from "@/lib/analytics/eventConstants";

describe("pathnameToEntity", () => {
  it("maps student payments", () => {
    expect(pathnameToEntity("/en/dashboard/student/payments")).toBe(AnalyticsEntity.payments);
  });

  it("maps parent payments", () => {
    expect(pathnameToEntity("/es/dashboard/parent/payments")).toBe(AnalyticsEntity.payments);
  });

  it("maps student messages", () => {
    expect(pathnameToEntity("/en/dashboard/student/messages")).toBe(AnalyticsEntity.messages);
  });

  it("maps parent messages", () => {
    expect(pathnameToEntity("/en/dashboard/parent/messages")).toBe(AnalyticsEntity.messages);
  });

  it("maps teacher messages", () => {
    expect(pathnameToEntity("/en/dashboard/teacher/messages")).toBe(AnalyticsEntity.teacherMessages);
  });

  it("maps admin settings", () => {
    expect(pathnameToEntity("/en/dashboard/admin/settings")).toBe(AnalyticsEntity.adminSettings);
  });

  it("maps bare student dashboard home", () => {
    expect(pathnameToEntity("/en/dashboard/student")).toBe(AnalyticsEntity.studentHome);
    expect(pathnameToEntity("/en/dashboard/student/")).toBe(AnalyticsEntity.studentHome);
  });

  it("defaults to route-prefixed entity", () => {
    expect(pathnameToEntity("/en/other")).toBe(`${AnalyticsEntity.pageViewPrefix}/en/other`);
  });
});
