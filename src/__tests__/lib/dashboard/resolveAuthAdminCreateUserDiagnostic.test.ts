import { describe, it, expect } from "vitest";
import {
  resolveAuthAdminCreateUserDiagnostic,
  resolveAuthAdminInviteCreateUserIssue,
} from "@/lib/dashboard/resolveAuthAdminCreateUserDiagnostic";

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

describe("resolveAuthAdminInviteCreateUserIssue", () => {
  it("detects duplicate as email_exists", () => {
    expect(resolveAuthAdminInviteCreateUserIssue({ message: "User already registered" })).toBe(
      "email_exists",
    );
  });

  it("detects rejected email formatting", () => {
    expect(
      resolveAuthAdminInviteCreateUserIssue({ message: "Invalid email address provider" }),
    ).toBe("invalid_email");
  });

  it("detects weak password independent of duplication", () => {
    expect(
      resolveAuthAdminInviteCreateUserIssue({ message: "Password is too weak for policy" }),
    ).toBe("weak_password");
  });

  it("detects signup disabled wording", () => {
    expect(
      resolveAuthAdminInviteCreateUserIssue({ message: "Signups disabled for this provider" }),
    ).toBe("signup_disabled");
  });

  it("detects HTTP 429 as rate limiting", () => {
    expect(
      resolveAuthAdminInviteCreateUserIssue({ message: "", status: 429 }),
    ).toBe("rate_limited");
  });

  it("returns unexpected for unrecognized errors", () => {
    expect(resolveAuthAdminInviteCreateUserIssue({ message: "upstream failure", code: "x" })).toBe(
      "unexpected",
    );
  });
});
