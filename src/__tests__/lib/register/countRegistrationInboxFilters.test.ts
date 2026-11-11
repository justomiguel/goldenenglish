/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  countRegistrationInboxFilters,
  mapInboxLeadFields,
} from "@/lib/register/countRegistrationInboxFilters";

describe("countRegistrationInboxFilters", () => {
  it("counts a fee lead and a zero-fee lead in different stages", () => {
    const counts = countRegistrationInboxFilters([
      { status: "new", fee_snapshot: { total: 80 } },
      { status: "contacted", fee_snapshot: { total: 80 } },
      {
        status: "contacted",
        fee_snapshot: { total: 80 },
        enrollment_fee_mail_sent_at: "2026-11-10T00:00:00.000Z",
      },
      { status: "new", fee_snapshot: { total: 80 }, fee_captured: true, accepted_student_id: "stu" },
      { status: "contacted", fee_snapshot: { total: 0 } },
    ]);
    expect(counts).toEqual({
      registered: 1,
      contacted: 1,
      awaiting_payment: 1,
      paid_without_section: 1,
      awaiting_section: 1,
    });
  });

  it("maps the mail stamp and a blank receipt path", () => {
    expect(
      mapInboxLeadFields({
        fee_captured: true,
        enrollment_fee_receipt_path: " /r.pdf ",
        enrollment_fee_mail_sent_at: "2026-11-10T00:00:00.000Z",
      }),
    ).toEqual(
      expect.objectContaining({
        feeCaptured: true,
        enrollmentFeeReceiptPath: " /r.pdf ",
        enrollmentFeeMailSentAt: "2026-11-10T00:00:00.000Z",
      }),
    );
    expect(mapInboxLeadFields({ enrollment_fee_receipt_path: "   " }).enrollmentFeeReceiptPath).toBeNull();
  });
});
