import { describe, it, expect, vi } from "vitest";
import type { FormEvent } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { StudentMonthlyTutorPaymentMethodTabs } from "@/components/student/StudentMonthlyTutorPaymentMethodTabs";
import { dictEn } from "@/test/dictEn";
import type {
  StudentMonthlyPaymentCell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";

const labels = dictEn.dashboard.student.monthly;

const sectionRow: StudentMonthlyPaymentSectionRow = {
  sectionId: "sec-1",
  sectionName: "B1 Tuesdays",
  cohortName: "Cohort",
  hasActivePlan: true,
  enrollmentFeeAmount: 0,
  enrollmentFeeExempt: true,
  enrollmentFeeExemptReason: null,
  enrollmentFeeCurrency: null,
  currentPlan: {
    id: "p",
    sectionId: "sec-1",
    effectiveFromYear: 2026,
    effectiveFromMonth: 1,
    monthlyFee: 999,
    currency: "CLP",
    archivedAt: null,
  },
  enrollmentId: null,
  enrollmentFeeReceiptStatus: null,
  enrollmentFeeReceiptSignedUrl: null,
  lastEnrollmentPaidAt: null,
  cells: [],
};

const dueCell: StudentMonthlyPaymentCell = {
  month: 5,
  year: 2026,
  status: "due",
  expectedAmount: 999,
  originalExpectedAmount: 999,
  scholarshipDiscountPercent: null,
  fullMonthExpectedAmount: 999,
  fullMonthOriginalExpectedAmount: 999,
  currency: "CLP",
  proration: { numerator: 1, denominator: 1 },
  recordedAmount: null,
  paymentId: null,
  receiptSignedUrl: null,
  isCurrent: true,
};

describe("StudentMonthlyTutorPaymentMethodTabs", () => {
  it("switches panels between receipt upload and Flow pay tab", () => {
    const onReceipt = vi.fn((e: FormEvent) => {
      e.preventDefault();
    });
    const onFlow = vi.fn();
    render(
      <StudentMonthlyTutorPaymentMethodTabs
        locale="en"
        studentId="stu-1"
        section={sectionRow}
        cell={dueCell}
        labels={labels}
        paymentLabels={dictEn.dashboard.student}
        fileUploadProgress={dictEn.common.fileUpload}
        expected={999}
        showFlowPay
        busy={false}
        flowBusy={false}
        feedbackMessage={null}
        onSubmitReceipt={onReceipt}
        onFlowPay={onFlow}
      />,
    );

    expect(screen.getByRole("tablist", { name: labels.paymentMethodTabsAria })).toBeInTheDocument();
    const receiptTab = screen.getByRole("tab", { name: labels.tutorMonthlyTabReceipt });
    const onlineTab = screen.getByRole("tab", { name: labels.tutorMonthlyTabOnline });
    expect(receiptTab).toHaveAttribute("aria-selected", "true");

    fireEvent.click(onlineTab);
    expect(screen.getByRole("button", { name: labels.payWithFlow })).toBeInTheDocument();

    fireEvent.click(receiptTab);
    expect(screen.getByText(dictEn.dashboard.student.payReceipt)).toBeVisible();
  });

  it("disables the online-pay tab when Flow is not enabled for the month", () => {
    render(
      <StudentMonthlyTutorPaymentMethodTabs
        locale="en"
        studentId="stu-1"
        section={sectionRow}
        cell={dueCell}
        labels={labels}
        paymentLabels={dictEn.dashboard.student}
        fileUploadProgress={dictEn.common.fileUpload}
        expected={999}
        showFlowPay={false}
        busy={false}
        flowBusy={false}
        feedbackMessage={null}
        onSubmitReceipt={vi.fn()}
        onFlowPay={vi.fn()}
      />,
    );
    const onlineTab = screen.getByRole("tab", { name: labels.tutorMonthlyTabOnline });
    expect(onlineTab).toBeDisabled();
    expect(onlineTab).toHaveAttribute("title", labels.tutorMonthlyPayOnlineUnavailableLead);
    expect(screen.getByRole("tab", { name: labels.tutorMonthlyTabReceipt })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
