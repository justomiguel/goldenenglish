import { describe, expect, it } from "vitest";
import { registrationFunnelStage, type RegistrationFunnelRow } from "@/lib/register/registrationFunnelStage";
import { registrationFunnelRevert, type FunnelRevertPatch } from "@/lib/register/registrationFunnelRevert";

function apply(row: RegistrationFunnelRow, patch: FunnelRevertPatch): RegistrationFunnelRow {
  return {
    ...row,
    status: patch.status ?? row.status,
    intakeState: patch.intake_state ?? row.intakeState,
    feeCaptured: patch.fee_captured === false ? false : row.feeCaptured,
    enrollmentFeeMailSentAt:
      patch.enrollment_fee_mail_sent_at === null ? null : row.enrollmentFeeMailSentAt,
    acceptedStudentId: row.acceptedStudentId,
  };
}

describe("registrationFunnelRevert", () => {
  it("walks a fee lead back and keeps the student account", () => {
    let row: RegistrationFunnelRow = {
      status: "new",
      snapshotTotal: 80,
      feeCaptured: true,
      enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
      acceptedStudentId: "stu-1",
      intakeState: "needs_section",
    };

    const fromPaid = registrationFunnelRevert(row);
    expect(fromPaid.ok).toBe(true);
    if (!fromPaid.ok) return;
    expect(fromPaid.nextStage).toBe("awaiting_payment");
    expect(fromPaid.patch.enrollment_fee_receipt_path).toBeNull();
    expect(fromPaid.patch).not.toHaveProperty("accepted_student_id");
    row = apply(row, fromPaid.patch);
    expect(row.acceptedStudentId).toBe("stu-1");
    expect(registrationFunnelStage(row)).toBe("awaiting_payment");

    const fromPayment = registrationFunnelRevert(row);
    expect(fromPayment.ok).toBe(true);
    if (!fromPayment.ok) return;
    row = apply(row, fromPayment.patch);
    expect(registrationFunnelStage(row)).toBe("contacted");
    expect(row.acceptedStudentId).toBe("stu-1");

    const fromContacted = registrationFunnelRevert(row);
    expect(fromContacted.ok).toBe(true);
    if (!fromContacted.ok) return;
    row = apply(row, fromContacted.patch);
    expect(registrationFunnelStage(row)).toBe("registered");
    expect(row.acceptedStudentId).toBe("stu-1");
  });

  it("walks a zero-fee lead back and keeps the student account", () => {
    const row: RegistrationFunnelRow = {
      status: "contacted",
      snapshotTotal: 0,
      acceptedStudentId: "stu-2",
    };
    const step = registrationFunnelRevert(row);
    expect(step.ok).toBe(true);
    if (!step.ok) return;
    const next = apply(row, step.patch);
    expect(registrationFunnelStage(next)).toBe("registered");
    expect(next.acceptedStudentId).toBe("stu-2");
  });

  it("returns a paid lead without a mail to contacted and keeps the student", () => {
    const row: RegistrationFunnelRow = {
      status: "contacted",
      snapshotTotal: 80,
      feeCaptured: true,
      acceptedStudentId: "stu-3",
    };
    const step = registrationFunnelRevert(row);
    expect(step.ok).toBe(true);
    if (!step.ok) return;
    const next = apply(row, step.patch);
    expect(registrationFunnelStage(next)).toBe("contacted");
    expect(next.acceptedStudentId).toBe("stu-3");
    expect(next.feeCaptured).toBe(false);
  });

  it("refuses the first stage and an enrolled lead", () => {
    expect(registrationFunnelRevert({ status: "new", snapshotTotal: 80 }).ok).toBe(false);
    expect(
      registrationFunnelRevert({ status: "enrolled", snapshotTotal: 80, feeCaptured: true }),
    ).toEqual({ ok: false, code: "funnel_revert_not_allowed" });
  });
});
