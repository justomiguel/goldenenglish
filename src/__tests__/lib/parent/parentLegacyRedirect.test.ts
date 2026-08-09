import { describe, expect, it } from "vitest";
import {
  parentProgressRedirectPath,
  parentRedirectPath,
} from "@/lib/parent/parentLegacyRedirect";

describe("parentRedirectPath", () => {
  it("keeps the child and section the old URL pointed at", () => {
    expect(
      parentRedirectPath("es", "/child/tasks", { studentId: "stu-1", sectionId: "sec-2" }),
    ).toBe("/es/dashboard/parent/child/tasks?studentId=stu-1&sectionId=sec-2");
  });

  it("omits the query when there is nothing to preserve", () => {
    expect(parentRedirectPath("en", "/account", {})).toBe("/en/dashboard/parent/account");
  });

  it("ignores empty params rather than writing blank values", () => {
    expect(parentRedirectPath("es", "/child", { studentId: "", sectionId: "sec-1" })).toBe(
      "/es/dashboard/parent/child?sectionId=sec-1",
    );
  });
});

describe("parentProgressRedirectPath", () => {
  it.each([
    ["exams", "/es/dashboard/parent/child/grades"],
    ["assessments", "/es/dashboard/parent/child/grades"],
    ["tasks", "/es/dashboard/parent/child/tasks"],
    ["feedback", "/es/dashboard/parent/child/feedback"],
    ["badges", "/es/dashboard/parent/child/badges"],
  ])("sends ?tab=%s to %s", (tab, expected) => {
    expect(parentProgressRedirectPath("es", { tab })).toBe(expected);
  });

  it("falls back to the child screen with no tab and with an unknown tab", () => {
    expect(parentProgressRedirectPath("es", {})).toBe("/es/dashboard/parent/child");
    expect(parentProgressRedirectPath("es", { tab: "nope" })).toBe(
      "/es/dashboard/parent/child",
    );
  });

  it("carries the child through the tab mapping", () => {
    expect(parentProgressRedirectPath("pt", { tab: "badges", studentId: "stu-9" })).toBe(
      "/pt/dashboard/parent/child/badges?studentId=stu-9",
    );
  });
});
