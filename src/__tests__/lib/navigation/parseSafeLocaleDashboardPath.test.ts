import { describe, expect, it } from "vitest";
import { parseSafeLocaleDashboardPath } from "@/lib/navigation/parseSafeLocaleDashboardPath";

describe("parseSafeLocaleDashboardPath", () => {
  it("accepts a path+query for the same locale under /dashboard", () => {
    expect(
      parseSafeLocaleDashboardPath("en", "/en/dashboard/admin/academic/c/s?tab=evaluations"),
    ).toBe("/en/dashboard/admin/academic/c/s?tab=evaluations");
  });

  it("rejects full URLs and open redirects", () => {
    expect(parseSafeLocaleDashboardPath("en", "https://evil.com/phish")).toBeNull();
    expect(parseSafeLocaleDashboardPath("en", "//evil.com")).toBeNull();
    expect(parseSafeLocaleDashboardPath("en", "/es/dashboard/admin")).toBeNull();
    expect(parseSafeLocaleDashboardPath("en", "javascript:alert(1)")).toBeNull();
  });

  it("rejects path tricks", () => {
    expect(parseSafeLocaleDashboardPath("en", "/en/dashboard/..%2Fadmin")).toBeNull();
  });
});
