import { describe, it, expect } from "vitest";
import { studentEnrollmentRenewalKind } from "@/lib/student/studentEnrollmentRenewalNotice";

const WARN = 300;

describe("studentEnrollmentRenewalKind", () => {
  it("returns none for minors", () => {
    expect(studentEnrollmentRenewalKind(true, "2020-01-01", new Date(), WARN)).toBe("none");
  });

  it("returns missing when no payment date", () => {
    expect(studentEnrollmentRenewalKind(false, null, new Date(), WARN)).toBe("missing_paid");
  });

  it("returns stale after warn window", () => {
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const old = new Date(now.getTime() - (WARN + 5) * 86400000);
    expect(studentEnrollmentRenewalKind(false, old.toISOString(), now, WARN)).toBe("stale_paid");
  });

  it("returns none when payment is recent", () => {
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const recent = new Date(now.getTime() - 30 * 86400000);
    expect(studentEnrollmentRenewalKind(false, recent.toISOString(), now, WARN)).toBe("none");
  });

  it("uses 300-day fallback when warnDays is invalid", () => {
    const now = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const old = new Date(now.getTime() - 305 * 86400000);
    expect(studentEnrollmentRenewalKind(false, old.toISOString(), now, Number.NaN)).toBe("stale_paid");
  });
});
