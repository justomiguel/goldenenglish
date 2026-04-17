import { describe, expect, it } from "vitest";
import { isProtectedTrafficPath } from "@/lib/analytics/protectedTrafficPath";

describe("isProtectedTrafficPath", () => {
  it("returns false for null/empty/non-absolute paths", () => {
    expect(isProtectedTrafficPath(null)).toBe(false);
    expect(isProtectedTrafficPath(undefined)).toBe(false);
    expect(isProtectedTrafficPath("")).toBe(false);
    expect(isProtectedTrafficPath("dashboard/student")).toBe(false);
  });

  it("flags locale-prefixed dashboard routes", () => {
    expect(isProtectedTrafficPath("/es/dashboard")).toBe(true);
    expect(isProtectedTrafficPath("/es/dashboard/student")).toBe(true);
    expect(isProtectedTrafficPath("/en/dashboard/admin/users/123")).toBe(true);
  });

  it("flags non-prefixed protected segments", () => {
    expect(isProtectedTrafficPath("/dashboard")).toBe(true);
    expect(isProtectedTrafficPath("/admin/users")).toBe(true);
    expect(isProtectedTrafficPath("/teacher/sections")).toBe(true);
    expect(isProtectedTrafficPath("/profile")).toBe(true);
  });

  it("flags protected API prefixes", () => {
    expect(isProtectedTrafficPath("/api/admin/import/jobs")).toBe(true);
    expect(isProtectedTrafficPath("/api/teacher/foo")).toBe(true);
  });

  it("does not flag public marketing/auth routes", () => {
    expect(isProtectedTrafficPath("/")).toBe(false);
    expect(isProtectedTrafficPath("/es")).toBe(false);
    expect(isProtectedTrafficPath("/es/login")).toBe(false);
    expect(isProtectedTrafficPath("/es/register")).toBe(false);
    expect(isProtectedTrafficPath("/api/analytics/events")).toBe(false);
  });

  it("does not match prefixes that just share a starting word", () => {
    expect(isProtectedTrafficPath("/es/dashboarding")).toBe(false);
    expect(isProtectedTrafficPath("/es/profileless")).toBe(false);
  });
});
