// REGRESSION CHECK: Month-0 matrix chip must honor staff "mark enrollment paid now"
// (persisted last_enrollment_paid_at), not only receipt approval.

import { describe, expect, it } from "vitest";
import {
  enrollmentFeeMatrixVisualFromAdminBillingBenefit,
  enrollmentFeeMatrixVisualFromSectionRow,
} from "@/lib/billing/enrollmentFeeMatrixVisual";

const baseOpts = {
  sectionStartsOn: "2026-03-01",
  enrolledAt: "2026-03-02T00:00:00Z",
  todayYear: 2026,
  todayMonth: 6,
};

describe("enrollmentFeeMatrixVisualFromSectionRow", () => {
  it("shows due when no receipt and not manually marked paid", () => {
    const v = enrollmentFeeMatrixVisualFromSectionRow(
      {
        enrollmentFeeAmount: 50,
        enrollmentFeeExempt: false,
        enrollmentFeeReceiptStatus: null,
        enrollmentFeeReceiptSignedUrl: null,
        lastEnrollmentPaidAt: null,
      },
      { sectionChargesEnrollmentFee: true, ...baseOpts },
    );
    expect(v).toEqual({ status: "due", isOverdue: true });
  });

  it("shows due when receipt status pending but no signed URL (data inconsistency)", () => {
    const v = enrollmentFeeMatrixVisualFromSectionRow(
      {
        enrollmentFeeAmount: 50,
        enrollmentFeeExempt: false,
        enrollmentFeeReceiptStatus: "pending",
        enrollmentFeeReceiptSignedUrl: null,
        lastEnrollmentPaidAt: null,
      },
      { sectionChargesEnrollmentFee: true, ...baseOpts },
    );
    expect(v).toEqual({ status: "due", isOverdue: true });
  });

  it("shows pending when receipt is pending and URL exists", () => {
    const v = enrollmentFeeMatrixVisualFromSectionRow(
      {
        enrollmentFeeAmount: 50,
        enrollmentFeeExempt: false,
        enrollmentFeeReceiptStatus: "pending",
        enrollmentFeeReceiptSignedUrl: "https://example.com/e.pdf",
        lastEnrollmentPaidAt: null,
      },
      { sectionChargesEnrollmentFee: true, ...baseOpts },
    );
    expect(v).toEqual({ status: "pending", isOverdue: false });
  });

  it("shows approved when last_enrollment_paid_at is set (manual mark paid)", () => {
    const v = enrollmentFeeMatrixVisualFromSectionRow(
      {
        enrollmentFeeAmount: 50,
        enrollmentFeeExempt: false,
        enrollmentFeeReceiptStatus: null,
        enrollmentFeeReceiptSignedUrl: null,
        lastEnrollmentPaidAt: "2026-04-01T12:00:00.000Z",
      },
      { sectionChargesEnrollmentFee: true, ...baseOpts },
    );
    expect(v).toEqual({ status: "approved", isOverdue: false });
  });
});

describe("enrollmentFeeMatrixVisualFromAdminBillingBenefit", () => {
  it("passes lastEnrollmentPaidAt through to section row rules", () => {
    const v = enrollmentFeeMatrixVisualFromAdminBillingBenefit(
      {
        sectionEnrollmentFeeAmount: 40,
        enrollmentFeeExempt: false,
        enrollmentFeeReceiptStatus: null,
        enrollmentFeeReceiptSignedUrl: null,
        lastEnrollmentPaidAt: "2026-05-01T00:00:00.000Z",
      },
      baseOpts,
    );
    expect(v?.status).toBe("approved");
  });
});
