import { describe, it, expect } from "vitest";
import {
  authInviteCollisionEmailMeta,
  authInviteEmailDomainSuffixForLog,
  resolveDashboardInviteSignupAttemptSubjectLog,
} from "@/lib/logging/authInviteAttemptLogMeta";

describe("authInviteAttemptLogMeta", () => {
  it("extracts domain suffix only (normalized lower email)", () => {
    expect(authInviteEmailDomainSuffixForLog("ana@school.example")).toBe("school.example");
    expect(authInviteEmailDomainSuffixForLog("bad")).toBeUndefined();
    expect(authInviteEmailDomainSuffixForLog("@onlydomain.com")).toBeUndefined();
    expect(authInviteEmailDomainSuffixForLog("  Ana@School.EXAMPLE  ")).toBe("school.example");
  });

  it("adds normalized collision login + domain suffix for duplicate-email diagnostics", () => {
    expect(authInviteCollisionEmailMeta(" Ana.Garcia@goldenenglish.ar ")).toEqual({
      collision_attempt_email_normalized: "ana.garcia@goldenenglish.ar",
      collision_email_domain_suffix: "goldenenglish.ar",
    });
  });

  it("resolves signup subject for dashboard invites", () => {
    expect(
      resolveDashboardInviteSignupAttemptSubjectLog({
        creatingMinorStudent: true,
        minorSyntheticEmailSource: {},
        inviteRole: "student",
      }),
    ).toBe("minor_student_institutional_generated_email");
    expect(
      resolveDashboardInviteSignupAttemptSubjectLog({
        creatingMinorStudent: true,
        minorSyntheticEmailSource: null,
        inviteRole: "student",
      }),
    ).toBe("minor_student_non_synthetic_login_email");
    expect(
      resolveDashboardInviteSignupAttemptSubjectLog({
        creatingMinorStudent: false,
        minorSyntheticEmailSource: null,
        inviteRole: "teacher",
      }),
    ).toBe("dashboard_invite:teacher");
  });
});
