// REGRESSION CHECK: Post-login redirect must land on /{locale}/dashboard when
// `next` is missing or unsafe — not the public landing (/).
import { describe, it, expect } from "vitest";
import {
  defaultPostLoginPath,
  safeInternalPath,
} from "@/lib/auth/loginSubmitSupport";

describe("loginSubmitSupport", () => {
  describe("defaultPostLoginPath", () => {
    it("returns the role-routing dashboard index for the locale", () => {
      expect(defaultPostLoginPath("es")).toBe("/es/dashboard");
      expect(defaultPostLoginPath("en")).toBe("/en/dashboard");
    });
  });

  describe("safeInternalPath", () => {
    it("defaults to dashboard when next is null or empty", () => {
      expect(safeInternalPath(null, "es")).toBe("/es/dashboard");
      expect(safeInternalPath(undefined, "en")).toBe("/en/dashboard");
      expect(safeInternalPath("", "pt")).toBe("/pt/dashboard");
      expect(safeInternalPath("   ", "es")).toBe("/es/dashboard");
    });

    it("preserves a safe internal next path", () => {
      expect(safeInternalPath("/es/dashboard/student", "es")).toBe(
        "/es/dashboard/student",
      );
    });

    it("rejects open-redirect patterns", () => {
      expect(safeInternalPath("//evil.com", "es")).toBe("/es/dashboard");
      expect(safeInternalPath("https://evil.com", "en")).toBe("/en/dashboard");
      expect(safeInternalPath("/es\\windows", "en")).toBe("/en/dashboard");
    });
  });
});
