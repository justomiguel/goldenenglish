/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { safeRecoveryRedirectPath } from "@/lib/auth/safeRecoveryRedirectPath";

describe("safeRecoveryRedirectPath", () => {
  it("allows en and es reset-password paths", () => {
    expect(safeRecoveryRedirectPath("/en/reset-password")).toBe("/en/reset-password");
    expect(safeRecoveryRedirectPath("/es/reset-password")).toBe("/es/reset-password");
  });

  it("rejects forged hosts and open redirects", () => {
    expect(safeRecoveryRedirectPath("//evil.com/phish")).toBe("/es/reset-password");
    expect(safeRecoveryRedirectPath("https://evil.com")).toBe("/es/reset-password");
    expect(safeRecoveryRedirectPath("/en/dashboard")).toBe("/es/reset-password");
  });

  it("strips query fragments from next", () => {
    expect(safeRecoveryRedirectPath("/es/reset-password?x=1")).toBe("/es/reset-password");
  });
});
