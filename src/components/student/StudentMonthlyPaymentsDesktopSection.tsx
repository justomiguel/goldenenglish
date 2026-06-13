"use client";

import { Tag } from "lucide-react";
import { StudentMonthlyPaymentCell } from "@/components/student/StudentMonthlyPaymentCell";
import {
  StudentMonthlyPaymentFocus,
  type SubmitMonthlyReceiptAction,
  type StartOnlineMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { PaymentGatewayProvider } from "@/types/paymentGateway";
import {
  StudentEnrollmentFeeUpload,
  type SubmitEnrollmentFeeReceiptAction,
} from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type {
  StudentMonthlyPaymentCell as Cell,
  StudentMonthlyPaymentSectionRow,
} from "@/types/studentMonthlyPayments";
import { studentMonthlyEnrollmentFeeDisplay } from "@/lib/student/studentMonthlyPaymentsStripHelpers";

type GridLegend = Dictionary["dashboard"]["student"]["paymentsPwa"]["legend"];

export interface StudentMonthlyPaymentsDesktopSectionProps {
  locale: Locale;
  studentId: string;
  row: StudentMonthlyPaymentSectionRow;
  sectionSettled: boolean;
  visibleCells: Cell[];
  monthLabels: string[];
  labels: Dictionary["dashboard"]["student"]["monthly"];
  paymentLabels: Dictionary["dashboard"]["student"];
  gridLegendLabels?: GridLegend;
  stripAria: string;
  isFocusedSection: boolean;
  focusMonth: number | null;
  focusedCell: Cell | null;
  onFocusMonth: (month: number) => void;
  submitAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  receiptExpectedUsesFullMonth: boolean;
  fileUploadProgress: FileUploadProgressLabels;
  startFlowMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  startMercadoPagoMonthlyPaymentAction?: StartOnlineMonthlyPaymentClientAction;
  enabledOnlineGateways: PaymentGatewayProvider[];
  tutorPaymentMethodTabs: boolean;
  onSubmitted: () => void;
  bankTransferInstructions?: string | null;
}

export function StudentMonthlyPaymentsDesktopSection({
  locale,
  studentId,
  row,
  sectionSettled,
  visibleCells,
  monthLabels,
  labels,
  paymentLabels,
  gridLegendLabels,
  stripAria,
  isFocusedSection,
  focusMonth,
  focusedCell,
  onFocusMonth,
  submitAction,
  submitEnrollmentFeeReceiptAction,
  receiptExpectedUsesFullMonth,
  fileUploadProgress,
  startFlowMonthlyPaymentAction,
  startMercadoPagoMonthlyPaymentAction,
  enabledOnlineGateways,
  tutorPaymentMethodTabs,
  onSubmitted,
  bankTransferInstructions = null,
}: StudentMonthlyPaymentsDesktopSectionProps) {
  return (
    <div
      className={
        sectionSettled
          ? "rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/45 bg-[var(--color-success)]/10 p-4 shadow-[var(--shadow-card)]"
          : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
      }
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
            {row.sectionName}
          </h2>
          {row.cohortName ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">{row.cohortName}</p>
          ) : null}
          {sectionSettled && gridLegendLabels ? (
            <p className="mt-1 text-xs font-medium text-[var(--color-success)]">
              {gridLegendLabels.sectionSettled}
            </p>
          ) : null}
        </div>
        {row.enrollmentFeeExempt ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-success)]"
            title={labels.enrollmentFeeExemptTitle}
          >
            <Tag className="h-3 w-3" aria-hidden />
            {labels.enrollmentFeeExemptBadge}
          </span>
        ) : row.enrollmentFeeAmount > 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium text-[var(--color-foreground)]"
            title={labels.enrollmentFeeTooltip.replace(
              "{amount}",
              studentMonthlyEnrollmentFeeDisplay(
                locale,
                row.enrollmentFeeAmount,
                row.enrollmentFeeCurrency,
              ),
            )}
          >
            <Tag className="h-3 w-3" aria-hidden />
            {labels.enrollmentFeeBadge.replace(
              "{amount}",
              studentMonthlyEnrollmentFeeDisplay(
                locale,
                row.enrollmentFeeAmount,
                row.enrollmentFeeCurrency,
              ),
            )}
          </span>
        ) : null}
      </header>
      <div
        role="grid"
        aria-label={`${row.sectionName} ${stripAria}`}
        className="grid grid-cols-6 gap-2 sm:grid-cols-12"
      >
        {visibleCells.map((cell) => (
          <StudentMonthlyPaymentCell
            key={`${row.sectionId}-${cell.month}`}
            cell={cell}
            monthLabel={monthLabels[cell.month - 1]!}
            labels={labels}
            isFocused={isFocusedSection && focusMonth === cell.month}
            onFocus={() => onFocusMonth(cell.month)}
          />
        ))}
      </div>
      {!row.hasActivePlan ? (
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">{labels.noPlanHint}</p>
      ) : null}
      {isFocusedSection && focusedCell ? (
        <StudentMonthlyPaymentFocus
          locale={locale}
          studentId={studentId}
          section={row}
          cell={focusedCell}
          monthLabel={monthLabels[focusedCell.month - 1]!}
          labels={labels}
          paymentLabels={paymentLabels}
          submitAction={submitAction}
          fileUploadProgress={fileUploadProgress}
          receiptExpectedUsesFullMonth={receiptExpectedUsesFullMonth}
          startFlowAction={startFlowMonthlyPaymentAction}
          startMercadoPagoAction={startMercadoPagoMonthlyPaymentAction}
          enabledOnlineGateways={enabledOnlineGateways}
          paymentMethodTabLayout={tutorPaymentMethodTabs}
          embeddedInSectionCard
          bankTransferInstructions={bankTransferInstructions}
          onSubmitted={onSubmitted}
        />
      ) : null}
      {row.enrollmentFeeExempt ? (
        <div
          className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3"
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
    </div>
  );
}
