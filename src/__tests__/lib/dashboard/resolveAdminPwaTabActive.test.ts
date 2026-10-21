import { describe, expect, it } from "vitest";
import {
  adminFinanceHrefForPathname,
  formatAdminPwaBadgeCount,
  resolveAdminPwaTabActive,
} from "@/lib/dashboard/resolveAdminPwaTabActive";

const base = "/es/dashboard/admin";

describe("resolveAdminPwaTabActive", () => {
  it("maps admin home, admissions, finance, and people routes", () => {
    expect(resolveAdminPwaTabActive(base, "es")).toBe("home");
    expect(resolveAdminPwaTabActive(`${base}/registrations`, "es")).toBe("registrations");
    expect(resolveAdminPwaTabActive(`${base}/finance?tab=collections`, "es")).toBe("finance");
    expect(resolveAdminPwaTabActive(`${base}/students`, "es")).toBe("people");
    expect(resolveAdminPwaTabActive(`${base}/parents/compose`, "es")).toBe("people");
    expect(resolveAdminPwaTabActive(`${base}/teachers`, "es")).toBe("people");
    expect(resolveAdminPwaTabActive(`${base}/users/new`, "es")).toBe("people");
  });

  it("maps secondary admin routes to more", () => {
    expect(resolveAdminPwaTabActive(`${base}/academic`, "es")).toBe("more");
    expect(resolveAdminPwaTabActive(`${base}/institute`, "es")).toBe("more");
    expect(resolveAdminPwaTabActive(`${base}/messages`, "es")).toBe("more");
    expect(resolveAdminPwaTabActive(`${base}/events`, "es")).toBe("more");
  });
});

describe("adminFinanceHrefForPathname", () => {
  it("keeps the finance hub unless the path is a cohort id", () => {
    expect(adminFinanceHrefForPathname(base, `${base}/students`)).toBe(`${base}/finance`);
    const cohort = "11111111-1111-4111-8111-111111111111";
    expect(adminFinanceHrefForPathname(base, `${base}/academic/${cohort}/sections`)).toBe(
      `${base}/finance?tab=collections&cohort=${cohort}`,
    );
  });
});

describe("formatAdminPwaBadgeCount", () => {
  it("hides zero and caps large counts", () => {
    expect(formatAdminPwaBadgeCount(0)).toBeNull();
    expect(formatAdminPwaBadgeCount(3)).toBe("3");
    expect(formatAdminPwaBadgeCount(120)).toBe("99+");
  });
});
