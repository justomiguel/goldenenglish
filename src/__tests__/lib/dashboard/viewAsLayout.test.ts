import { describe, expect, it } from "vitest";
import {
  filterAccountItemsForViewAs,
  portalPageAllowsSession,
  viewAsPortalRedirect,
} from "@/lib/dashboard/viewAsLayout";
import type { DashboardActor } from "@/lib/dashboard/viewAsTypes";

const adminActor = (over: Partial<DashboardActor> = {}): DashboardActor => ({
  sessionUserId: "admin-1",
  viewerId: "admin-1",
  isAdmin: true,
  viewAs: null,
  redirectAdminEnded: false,
  clearCookie: false,
  ...over,
});

describe("viewAsPortalRedirect", () => {
  it("sends an ended cookie to admin with the toast query", () => {
    expect(
      viewAsPortalRedirect("en", adminActor({ redirectAdminEnded: true }), "student", {
        sessionProfileRole: "admin",
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
      }),
    ).toBe("/en/dashboard/admin?viewAs=ended");
  });

  it("lets an admin + student view-as into the student portal", () => {
    expect(
      viewAsPortalRedirect(
        "en",
        adminActor({
          viewerId: "stu-1",
          viewAs: { id: "stu-1", displayName: "Ana", role: "student" },
        }),
        "student",
        {
          sessionProfileRole: "admin",
          teacherPortalAllowed: true,
          assistantPortalAllowed: false,
        },
      ),
    ).toBeNull();
  });

  it("redirects an admin without view-as away from the student portal", () => {
    expect(
      viewAsPortalRedirect("en", adminActor(), "student", {
        sessionProfileRole: "admin",
        teacherPortalAllowed: true,
        assistantPortalAllowed: false,
      }),
    ).toBe("/en/dashboard");
  });
});

describe("portalPageAllowsSession", () => {
  it("allows an admin viewing as a student", () => {
    expect(
      portalPageAllowsSession("admin", "student", {
        id: "stu-1",
        displayName: "Ana",
        role: "student",
      }),
    ).toBe(true);
    expect(portalPageAllowsSession("admin", "student", null)).toBe(false);
  });
});

describe("filterAccountItemsForViewAs", () => {
  const items = [
    { id: "profile", href: "/en/dashboard/profile" },
    { id: "settings", href: "/en/dashboard/student/settings" },
    { id: "language", action: "language" },
    { id: "signOut", action: "signOut" },
  ];

  it("hides sign-out and own profile while viewing as someone", () => {
    expect(
      filterAccountItemsForViewAs(items, { id: "stu-1", displayName: "Ana", role: "student" }).map(
        (i) => i.id,
      ),
    ).toEqual(["settings", "language"]);
  });
});
