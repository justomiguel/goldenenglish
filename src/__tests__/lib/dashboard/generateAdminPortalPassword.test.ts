import { describe, it, expect } from "vitest";
import { generateAdminPortalPassword } from "@/lib/dashboard/generateAdminPortalPassword";

describe("generateAdminPortalPassword", () => {
  it("returns alphanumeric string of expected length", () => {
    const pwd = generateAdminPortalPassword(24);
    expect(pwd).toMatch(/^[a-zA-Z0-9]{24}$/);
  });

  it("produces different values across calls", () => {
    const a = generateAdminPortalPassword(32);
    const b = generateAdminPortalPassword(32);
    expect(a).not.toBe(b);
  });
});
