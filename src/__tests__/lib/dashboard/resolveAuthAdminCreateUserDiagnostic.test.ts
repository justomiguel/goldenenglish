import { describe, it, expect } from "vitest";
import { resolveAuthAdminCreateUserDiagnostic } from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";

describe("resolveAuthAdminCreateUserDiagnostic", () => {
  it("detects duplicate email wording", () => {
    expect(
      resolveAuthAdminCreateUserDiagnostic({ message: "User already registered" }),
    ).toBe("email_exists");
    expect(resolveAuthAdminCreateUserDiagnostic({ code: "email_exists" })).toBe("email_exists");
  });

  it("detects weak password wording", () => {
    expect(
      resolveAuthAdminCreateUserDiagnostic({ message: "Password is too weak" }),
    ).toBe("weak_password");
  });

  it("returns null for unrecognized errors", () => {
    expect(resolveAuthAdminCreateUserDiagnostic({ message: "Network down" })).toBe(null);
  });
});
