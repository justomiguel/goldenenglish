/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import { mustRedirectToResetPassword } from "@/lib/supabase/mustRedirectToResetPassword";

const userWithFlag = {
  app_metadata: { must_change_password: true },
};

describe("mustRedirectToResetPassword", () => {
  it("returns false when no user is present", () => {
    expect(mustRedirectToResetPassword(null, "/es/dashboard")).toBe(false);
    expect(mustRedirectToResetPassword(undefined, "/es/dashboard")).toBe(false);
  });

  it("returns false when the flag is missing or false", () => {
    expect(mustRedirectToResetPassword({ app_metadata: {} }, "/es/dashboard")).toBe(
      false,
    );
    expect(
      mustRedirectToResetPassword(
        { app_metadata: { must_change_password: false } },
        "/es/dashboard",
      ),
    ).toBe(false);
    expect(
      mustRedirectToResetPassword({ app_metadata: null }, "/es/dashboard"),
    ).toBe(false);
  });

  it("returns true when the flag is set and pathname is a regular dashboard route", () => {
    expect(mustRedirectToResetPassword(userWithFlag, "/es/dashboard")).toBe(true);
    expect(
      mustRedirectToResetPassword(userWithFlag, "/en/dashboard/admin/users"),
    ).toBe(true);
  });

  it("never redirects away from /reset-password (any locale)", () => {
    expect(mustRedirectToResetPassword(userWithFlag, "/es/reset-password")).toBe(
      false,
    );
    expect(mustRedirectToResetPassword(userWithFlag, "/en/reset-password")).toBe(
      false,
    );
  });

  it("never redirects away from /forgot-password (allow logout flow recovery)", () => {
    expect(mustRedirectToResetPassword(userWithFlag, "/es/forgot-password")).toBe(
      false,
    );
  });

  it("never blocks API routes that the reset flow itself depends on", () => {
    expect(
      mustRedirectToResetPassword(userWithFlag, "/api/auth/recovery-callback"),
    ).toBe(false);
    expect(mustRedirectToResetPassword(userWithFlag, "/api/auth/sign-out")).toBe(
      false,
    );
    expect(mustRedirectToResetPassword(userWithFlag, "/api/analytics/events")).toBe(
      false,
    );
  });

  it("never blocks the login route itself", () => {
    expect(mustRedirectToResetPassword(userWithFlag, "/es/login")).toBe(false);
    expect(mustRedirectToResetPassword(userWithFlag, "/en/login")).toBe(false);
  });

  it("does not match unrelated paths that contain the substring", () => {
    expect(
      mustRedirectToResetPassword(userWithFlag, "/es/dashboard/reset-password-info"),
    ).toBe(true);
  });
});
