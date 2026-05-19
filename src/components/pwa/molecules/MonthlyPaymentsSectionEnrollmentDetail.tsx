"use client";

import { MonthlyPaymentsPwaNestedDetail } from "@/components/pwa/molecules/MonthlyPaymentsPwaNestedDetail";
import {
  StudentEnrollmentFeeUpload,
  type SubmitEnrollmentFeeReceiptAction,
} from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

export interface MonthlyPaymentsSectionEnrollmentDetailProps {
  locale: Locale;
  studentId: string;
  row: StudentMonthlyPaymentSectionRow;
  detailPanelTitle: string;
  enrollmentFeeChipLabel: string;
  labels: MonthlyLabels;
  fileUploadProgress: FileUploadProgressLabels;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  onSubmitted: () => void;
}

export function MonthlyPaymentsSectionEnrollmentDetail({
  locale,
  studentId,
  row,
  detailPanelTitle,
  enrollmentFeeChipLabel,
  labels,
  fileUploadProgress,
  submitEnrollmentFeeReceiptAction,
  onSubmitted,
}: MonthlyPaymentsSectionEnrollmentDetailProps) {
  return (
    <MonthlyPaymentsPwaNestedDetail
      title={detailPanelTitle.replace("{label}", enrollmentFeeChipLabel)}
    >
      {row.enrollmentFeeExempt ? (
        <EnrollmentExemptNotice row={row} labels={labels} />
      ) : row.enrollmentFeeAmount > 0 && row.enrollmentId ? (
        <StudentEnrollmentFeeUpload
          locale={locale}
          studentId={studentId}
          sectionId={row.sectionId}
          enrollmentId={row.enrollmentId}
          receiptStatus={row.enrollmentFeeReceiptStatus}
          receiptSignedUrl={row.enrollmentFeeReceiptSignedUrl}
          labels={labels}
          fileUploadProgress={fileUploadProgress}
          submitAction={submitEnrollmentFeeReceiptAction}
          onSubmitted={onSubmitted}
        />
      ) : null}
    </MonthlyPaymentsPwaNestedDetail>
  );
}

function EnrollmentExemptNotice({
  row,
  labels,
}: {
  row: StudentMonthlyPaymentSectionRow;
  labels: MonthlyLabels;
}) {
  return (
    <div
      className="rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3"
      role="status"
    >
      <p className="text-sm font-semibold text-[var(--color-success)]">
        {labels.enrollmentFeeExemptTitle}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-foreground)]">{labels.enrollmentFeeExemptBody}</p>
      {row.enrollmentFeeExemptReason ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.enrollmentFeeExemptReason.replace("{reason}", row.enrollmentFeeExemptReason)}
        </p>
      ) : null}
    </div>
  );
}
