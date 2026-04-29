import { useMemo } from "react";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import type { Dictionary } from "@/types/i18n";
import type { StudentMonthlyPaymentCell } from "@/types/studentMonthlyPayments";

type BillingLabels = Dictionary["admin"]["billing"];

export function useAdminRecordPaymentPanelLabels(args: {
  labels: BillingLabels;
  sectionName: string;
  studentName: string;
  showEnrollmentMonthZero: boolean;
  enrollmentMonthZeroVisual: {
    status: StudentMonthlyPaymentCell["status"];
    isOverdue: boolean;
  } | null;
  enrollmentFeeModalOpenSetter: () => void;
  hasEnrollmentFeeModal: boolean;
  busy: boolean;
  monthStates: AdminBillingMonthState[];
  enrollmentFeeReceiptSignedUrl: string | null;
}) {
  const {
    labels,
    sectionName,
    studentName,
    showEnrollmentMonthZero,
    enrollmentMonthZeroVisual,
    enrollmentFeeModalOpenSetter,
    hasEnrollmentFeeModal,
    busy,
    monthStates,
    enrollmentFeeReceiptSignedUrl,
  } = args;

  const monthGridLabels = useMemo(
    () => ({
      selectAll: labels.recordPaymentSelectAll,
      clear: labels.recordPaymentClear,
      countSelected: labels.recordPaymentCountSelected,
      gridHint: labels.recordPaymentGridHint,
      matrixLegend: labels.recordPaymentMatrixLegend,
      matrixLegendOpenButton: labels.matrixLegendOpenButton,
      matrixLegendModalTitle: labels.matrixLegendModalTitle,
      cancelLabel: labels.cancel,
      matrixLegendScholarshipSample: labels.recordPaymentMatrixLegendScholarshipSample,
      statusPaid: labels.recordPaymentStatusPaid,
      statusPending: labels.recordPaymentStatusPending,
      statusRejected: labels.recordPaymentStatusRejected,
      statusExempt: labels.recordPaymentStatusExempt,
      statusUnpaid: labels.recordPaymentStatusUnpaid,
      statusOverdue: labels.recordPaymentStatusOverdue,
      statusNoPlan: labels.recordPaymentStatusNoPlan,
      statusOutOfPeriod: labels.recordPaymentStatusOutOfPeriod,
      scholarship: labels.recordPaymentScholarshipBadge,
      legacy: labels.recordPaymentLegacyStatus,
      monthZeroColumnShort: labels.recordPaymentMonthZeroColumnShort,
      monthZeroTooltip: labels.recordPaymentMonthZeroTooltip,
      viewReceipt: labels.recordPaymentViewReceipt,
    }),
    [labels],
  );

  const enrollmentColumnLabels = useMemo(
    () => ({
      statusPaid: labels.recordPaymentStatusPaid,
      statusPending: labels.recordPaymentStatusPending,
      statusRejected: labels.recordPaymentStatusRejected,
      statusExempt: labels.recordPaymentStatusExempt,
      statusUnpaid: labels.recordPaymentStatusUnpaid,
      statusOverdue: labels.recordPaymentStatusOverdue,
      monthZeroColumnShort: labels.recordPaymentMonthZeroColumnShort,
      monthZeroTooltip: labels.recordPaymentMonthZeroTooltip,
      enrollmentColumnActivate: labels.recordPaymentEnrollmentColumnActivate.replace(
        "{section}",
        sectionName,
      ),
      viewReceipt: labels.recordPaymentViewReceipt,
    }),
    [labels, sectionName],
  );

  const enrollmentMonthZero = showEnrollmentMonthZero
    ? {
        visual: enrollmentMonthZeroVisual,
        ariaLabel: labels.recordPaymentEnrollmentFeeChipAria.replace("{name}", studentName),
        labels: enrollmentColumnLabels,
        onActivate: hasEnrollmentFeeModal ? enrollmentFeeModalOpenSetter : undefined,
        disabled: busy,
        receiptSignedUrl: enrollmentFeeReceiptSignedUrl,
      }
    : null;

  const selectableMonths = monthStates.filter((s) => s.selectable).map((s) => s.month);

  return { monthGridLabels, enrollmentMonthZero, selectableMonths };
}
