import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminRecordPaymentBulkConfirmForm } from "@/components/dashboard/AdminRecordPaymentBulkConfirmForm";
import dict from "@/dictionaries/en.json";

const labels = dict.admin.billing;

describe("AdminRecordPaymentBulkConfirmForm", () => {
  it("shows the method select on the paid action", () => {
    render(
      <AdminRecordPaymentBulkConfirmForm
        pendingAction="paid"
        paidNoteId="paid-note"
        scholarshipNoteId="scholarship-note"
        exemptNoteId="exempt-note"
        modalAdminNote=""
        scholarshipConfirmReady={false}
        busy={false}
        locale="en"
        labels={labels}
        referenceMonthlyAmount={null}
        referenceMonthlyCurrency={null}
        onAdminNoteChange={vi.fn()}
        paymentMethod="cash"
        paidOn="2026-11-06"
        onPaymentMethodChange={vi.fn()}
        onPaidOnChange={vi.fn()}
        onResolvedScholarshipPercentChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(labels.paymentMethodLabel)).toHaveValue("cash");
  });
});