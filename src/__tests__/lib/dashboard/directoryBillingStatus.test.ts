import { describe, expect, it } from "vitest";
import {
  directoryBillingMarkSortRank,
  directoryEnrollmentFeeStatus,
  directoryFlagsFromEnrollmentFacts,
  directoryMonthlyStatus,
  enrollmentFeeChargeState,
  formatDirectoryLastEnrollment,
  latestEnrollmentAt,
  monthlyAppliesFromPaymentCells,
  rollupDirectoryBillingMarks,
  rollupParentBillingFlags,
} from "@/lib/dashboard/directoryBillingStatus";

describe("directoryMonthlyStatus", () => {
  it("is na when no monthly fee applies", () => {
    expect(directoryMonthlyStatus({ monthlyApplies: false, overdue: true })).toBe("na");
    expect(directoryMonthlyStatus({ monthlyApplies: false, overdue: false })).toBe("na");
  });

  it("is no when monthly fee applies and there is overdue", () => {
    expect(directoryMonthlyStatus({ monthlyApplies: true, overdue: true })).toBe("no");
  });

  it("is yes when monthly fee applies and nothing is overdue", () => {
    expect(directoryMonthlyStatus({ monthlyApplies: true, overdue: false })).toBe("yes");
  });
});

describe("enrollmentFeeChargeState", () => {
  it("is not charged when amount is 0 or exempt", () => {
    expect(
      enrollmentFeeChargeState({
        amount: 0,
        exempt: false,
        lastEnrollmentPaidAt: null,
        receiptStatus: null,
      }),
    ).toEqual({ charged: false, paid: false });
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: true,
        lastEnrollmentPaidAt: null,
        receiptStatus: null,
      }),
    ).toEqual({ charged: false, paid: false });
  });

  it("is paid when marked paid or receipt is approved", () => {
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: false,
        lastEnrollmentPaidAt: "2026-03-01T00:00:00.000Z",
        receiptStatus: "pending",
      }).paid,
    ).toBe(true);
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: false,
        lastEnrollmentPaidAt: null,
        receiptStatus: "approved",
      }).paid,
    ).toBe(true);
  });

  it("is unpaid when charged and pending, rejected, or due", () => {
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: false,
        lastEnrollmentPaidAt: null,
        receiptStatus: "pending",
      }),
    ).toEqual({ charged: true, paid: false });
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: false,
        lastEnrollmentPaidAt: null,
        receiptStatus: "rejected",
      }).paid,
    ).toBe(false);
    expect(
      enrollmentFeeChargeState({
        amount: 50,
        exempt: false,
        lastEnrollmentPaidAt: null,
        receiptStatus: null,
      }).paid,
    ).toBe(false);
  });
});

describe("directoryEnrollmentFeeStatus", () => {
  it("is na when nothing is charged", () => {
    expect(directoryEnrollmentFeeStatus([])).toBe("na");
    expect(directoryEnrollmentFeeStatus([{ charged: false, paid: false }])).toBe("na");
  });

  it("is no when any charged fee is unpaid", () => {
    expect(
      directoryEnrollmentFeeStatus([
        { charged: true, paid: true },
        { charged: true, paid: false },
      ]),
    ).toBe("no");
  });

  it("is yes when every charged fee is paid", () => {
    expect(
      directoryEnrollmentFeeStatus([
        { charged: false, paid: false },
        { charged: true, paid: true },
      ]),
    ).toBe("yes");
  });
});

describe("rollupDirectoryBillingMarks", () => {
  it("is no if any child is no", () => {
    expect(rollupDirectoryBillingMarks(["yes", "no", "na"])).toBe("no");
  });

  it("is yes if at least one yes and none no", () => {
    expect(rollupDirectoryBillingMarks(["yes", "na"])).toBe("yes");
  });

  it("is na when every child is na or the list is empty", () => {
    expect(rollupDirectoryBillingMarks(["na", "na"])).toBe("na");
    expect(rollupDirectoryBillingMarks([])).toBe("na");
  });
});

describe("latestEnrollmentAt", () => {
  it("returns the latest ISO timestamp and ignores empty values", () => {
    expect(
      latestEnrollmentAt(["2026-01-01T00:00:00.000Z", null, "2026-08-01T12:00:00.000Z"]),
    ).toBe("2026-08-01T12:00:00.000Z");
    expect(latestEnrollmentAt([null, ""])).toBeNull();
  });
});

describe("directoryBillingMarkSortRank", () => {
  it("orders no before na before yes", () => {
    expect(directoryBillingMarkSortRank("no")).toBeLessThan(directoryBillingMarkSortRank("na"));
    expect(directoryBillingMarkSortRank("na")).toBeLessThan(directoryBillingMarkSortRank("yes"));
  });
});

describe("monthlyAppliesFromPaymentCells", () => {
  it("is true only when a cell is a real monthly charge state", () => {
    expect(monthlyAppliesFromPaymentCells([{ status: "no-plan" }, { status: "out-of-period" }])).toBe(
      false,
    );
    expect(monthlyAppliesFromPaymentCells([{ status: "due" }])).toBe(true);
  });
});

describe("directoryFlagsFromEnrollmentFacts", () => {
  it("builds per-student marks from enrollment facts and monthly signals", () => {
    const flags = directoryFlagsFromEnrollmentFacts({
      studentIds: ["s1", "s2"],
      enrollments: [
        {
          studentId: "s1",
          createdAt: "2026-02-01T00:00:00.000Z",
          amount: 40,
          exempt: false,
          lastEnrollmentPaidAt: null,
          receiptStatus: null,
        },
        {
          studentId: "s1",
          createdAt: "2026-08-01T00:00:00.000Z",
          amount: 40,
          exempt: false,
          lastEnrollmentPaidAt: "2026-08-02T00:00:00.000Z",
          receiptStatus: null,
        },
      ],
      monthlyByStudent: new Map([
        ["s1", { applies: true, overdue: true }],
        ["s2", { applies: false, overdue: false }],
      ]),
    });
    expect(flags.get("s1")).toEqual({
      monthlyStatus: "no",
      enrollmentFeeStatus: "no",
      lastEnrollmentAt: "2026-08-01T00:00:00.000Z",
    });
    expect(flags.get("s2")).toEqual({
      monthlyStatus: "na",
      enrollmentFeeStatus: "na",
      lastEnrollmentAt: null,
    });
  });
});

describe("rollupParentBillingFlags", () => {
  it("rolls child marks and keeps the latest enrollment", () => {
    expect(
      rollupParentBillingFlags([
        { monthlyStatus: "yes", enrollmentFeeStatus: "na", lastEnrollmentAt: "2026-01-01T00:00:00.000Z" },
        { monthlyStatus: "na", enrollmentFeeStatus: "no", lastEnrollmentAt: "2026-07-01T00:00:00.000Z" },
      ]),
    ).toEqual({
      monthlyStatus: "yes",
      enrollmentFeeStatus: "no",
      lastEnrollmentAt: "2026-07-01T00:00:00.000Z",
    });
  });
});

describe("formatDirectoryLastEnrollment", () => {
  it("returns the empty value when there is no valid date", () => {
    expect(formatDirectoryLastEnrollment(null, "es", "—")).toBe("—");
    expect(formatDirectoryLastEnrollment("nope", "es", "—")).toBe("—");
  });

  it("formats a valid ISO date for the locale", () => {
    const label = formatDirectoryLastEnrollment("2026-03-15T00:00:00.000Z", "en", "—");
    expect(label).not.toBe("—");
    expect(label.length).toBeGreaterThan(0);
  });
});
