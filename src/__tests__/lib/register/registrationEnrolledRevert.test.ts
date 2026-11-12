import { describe, expect, it } from "vitest";
import { registrationEnrolledRevert } from "@/lib/register/registrationEnrolledRevert";

describe("registrationEnrolledRevert", () => {
  it("refuses a lead that is not enrolled", () => {
    const result = registrationEnrolledRevert({
      status: "contacted",
      snapshotTotal: 80,
      feeCaptured: true,
      enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
    });
    expect(result).toEqual({ ok: false, code: "enrolled_revert_failed" });
  });

  it("returns an enrolled fee lead with mail to awaiting payment and clears the payment", () => {
    const result = registrationEnrolledRevert({
      status: "enrolled",
      snapshotTotal: 80,
      feeCaptured: true,
      enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
      acceptedStudentId: "stu-1",
    });
    expect(result).toEqual({
      ok: true,
      nextStage: "awaiting_payment",
      clearPayment: true,
    });
  });

  it("treats a pending receipt as mail sent", () => {
    const result = registrationEnrolledRevert({
      status: "enrolled",
      chargesEnrollmentFee: true,
      feeCaptured: true,
      intakeState: "receipt_pending",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nextStage).toBe("awaiting_payment");
    expect(result.clearPayment).toBe(true);
  });

  it("returns an enrolled fee lead without mail to contacted", () => {
    const result = registrationEnrolledRevert({
      status: "enrolled",
      snapshotTotal: 80,
      feeCaptured: true,
    });
    expect(result).toEqual({
      ok: true,
      nextStage: "contacted",
      clearPayment: true,
    });
  });

  it("returns an enrolled lead with no fee to awaiting section and keeps the payment columns", () => {
    const result = registrationEnrolledRevert({
      status: "enrolled",
      snapshotTotal: 0,
      chargesEnrollmentFee: false,
      acceptedStudentId: "stu-1",
    });
    expect(result).toEqual({
      ok: true,
      nextStage: "awaiting_section",
      clearPayment: false,
    });
  });
});
