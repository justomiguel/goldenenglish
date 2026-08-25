import { afterEach, describe, expect, it } from "vitest";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import { signViewAsCookie } from "@/lib/dashboard/viewAsCookie";
import {
  portalAllowsActor,
  resolveDashboardActorState,
  startViewAsDecision,
} from "@/lib/dashboard/resolveDashboardActor";

const student = {
  id: "stu-1",
  role: "student",
  first_name: "Ana",
  last_name: "Pérez",
};

describe("resolveDashboardActorState", () => {
  const previous = process.env.CRON_SECRET;

  afterEach(() => {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });

  it("uses the session when there is no cookie", () => {
    expect(
      resolveDashboardActorState({
        sessionUserId: "admin-1",
        isAdmin: true,
        cookieValue: null,
        subject: null,
      }),
    ).toEqual({
      viewerId: "admin-1",
      viewAs: null,
      redirectAdminEnded: false,
      clearCookie: false,
    });
  });

  it("ignores the cookie for a non-admin", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const cookieValue = signViewAsCookie(student.id);
    expect(
      resolveDashboardActorState({
        sessionUserId: "teacher-1",
        isAdmin: false,
        cookieValue,
        subject: student,
      }).viewAs,
    ).toBeNull();
  });

  it("sets view-as for a valid student subject", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const cookieValue = signViewAsCookie(student.id);
    const result = resolveDashboardActorState({
      sessionUserId: "admin-1",
      isAdmin: true,
      cookieValue,
      subject: student,
    });
    expect(result.viewerId).toBe("stu-1");
    expect(result.viewAs).toEqual({
      id: "stu-1",
      displayName: "Ana Pérez",
      role: "student",
    });
    expect(result.redirectAdminEnded).toBe(false);
  });

  it("ends preview for a tampered cookie", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const result = resolveDashboardActorState({
      sessionUserId: "admin-1",
      isAdmin: true,
      cookieValue: "not-a-token",
      subject: student,
    });
    expect(result.redirectAdminEnded).toBe(true);
    expect(result.clearCookie).toBe(true);
    expect(result.viewAs).toBeNull();
  });

  it("ends preview for site_contact and for another admin", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const contactCookie = signViewAsCookie(PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID);
    expect(
      resolveDashboardActorState({
        sessionUserId: "admin-1",
        isAdmin: true,
        cookieValue: contactCookie,
        subject: {
          id: PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID,
          role: "site_contact",
          first_name: "Site",
          last_name: "Contact",
        },
      }).redirectAdminEnded,
    ).toBe(true);

    const adminCookie = signViewAsCookie("admin-2");
    expect(
      resolveDashboardActorState({
        sessionUserId: "admin-1",
        isAdmin: true,
        cookieValue: adminCookie,
        subject: { id: "admin-2", role: "admin", first_name: "Other", last_name: "Admin" },
      }).redirectAdminEnded,
    ).toBe(true);
  });

  it("clears a self-pick without the ended toast", () => {
    process.env.CRON_SECRET = "view-as-test-secret";
    const cookieValue = signViewAsCookie("admin-1");
    const result = resolveDashboardActorState({
      sessionUserId: "admin-1",
      isAdmin: true,
      cookieValue,
      subject: { id: "admin-1", role: "admin", first_name: "Ada", last_name: "Lovelace" },
    });
    expect(result.clearCookie).toBe(true);
    expect(result.redirectAdminEnded).toBe(false);
    expect(result.viewAs).toBeNull();
  });
});

describe("portalAllowsActor", () => {
  it("lets an admin into the student portal only while view-as is a student", () => {
    expect(
      portalAllowsActor("student", {
        sessionProfileRole: "admin",
        isAdmin: true,
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
        viewAs: { id: "stu-1", displayName: "Ana", role: "student" },
      }),
    ).toBe("allow");
    expect(
      portalAllowsActor("student", {
        sessionProfileRole: "admin",
        isAdmin: true,
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
        viewAs: null,
      }),
    ).toBe("deny");
  });

  it("mismatches when the cookie role is not this portal", () => {
    expect(
      portalAllowsActor("teacher", {
        sessionProfileRole: "admin",
        isAdmin: true,
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
        viewAs: { id: "stu-1", displayName: "Ana", role: "student" },
      }),
    ).toBe("mismatch");
  });

  it("keeps today's teacher access when view-as is unset", () => {
    expect(
      portalAllowsActor("teacher", {
        sessionProfileRole: "admin",
        isAdmin: true,
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
        viewAs: null,
      }),
    ).toBe("allow");
  });
});

describe("startViewAsDecision", () => {
  it("sets a student and treats another admin as own admin workspace", () => {
    expect(
      startViewAsDecision({ sessionUserId: "admin-1", isAdmin: true, subject: student }),
    ).toEqual({
      kind: "set",
      subject: { id: "stu-1", displayName: "Ana Pérez", role: "student" },
    });
    expect(
      startViewAsDecision({
        sessionUserId: "admin-1",
        isAdmin: true,
        subject: { id: "admin-2", role: "admin", first_name: "Other", last_name: "Admin" },
      }),
    ).toEqual({ kind: "own", role: "admin" });
  });

  it("rejects a non-admin caller", () => {
    expect(
      startViewAsDecision({ sessionUserId: "teacher-1", isAdmin: false, subject: student }),
    ).toEqual({ kind: "reject" });
  });
});
