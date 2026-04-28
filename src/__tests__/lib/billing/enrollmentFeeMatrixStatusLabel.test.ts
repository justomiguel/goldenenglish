import { describe, expect, it } from "vitest";
import { enrollmentFeeMatrixStatusLabel } from "@/lib/billing/enrollmentFeeMatrixStatusLabel";

const L = {
  statusPaid: "Paid",
  statusPending: "Pending",
  statusRejected: "Rejected",
  statusExempt: "Exempt",
  statusUnpaid: "Not paid",
  statusOverdue: "Overdue",
};

describe("enrollmentFeeMatrixStatusLabel", () => {
  it("maps due + overdue to overdue copy", () => {
    expect(
      enrollmentFeeMatrixStatusLabel({ status: "due", isOverdue: true }, L),
    ).toBe("Overdue");
  });

  it("maps due without overdue to unpaid copy", () => {
    expect(
      enrollmentFeeMatrixStatusLabel({ status: "due", isOverdue: false }, L),
    ).toBe("Not paid");
  });

  it("maps approved to paid copy", () => {
    expect(enrollmentFeeMatrixStatusLabel({ status: "approved", isOverdue: false }, L)).toBe(
      "Paid",
    );
  });
});
