"use client";

import { useRouter } from "next/navigation";
import { MonthlyPaymentsGridLegend } from "@/components/student/MonthlyPaymentsGridLegend";
import { MonthlyPaymentsSectionAccordion } from "@/components/pwa/molecules/MonthlyPaymentsSectionAccordion";
import type {
  SubmitMonthlyReceiptAction,
  StartFlowMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentSectionRow } from "@/types/studentMonthlyPayments";
import { filterMonthlyStripVisibleCells } from "@/lib/billing/filterMonthlyStripVisibleCells";
import { isSectionMonthlyPaymentsFullySettled } from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";
import { monthlyStripFindCell } from "@/lib/student/studentMonthlyPaymentsStripHelpers";
import type { StudentMonthlyPaymentsStripFocus } from "@/lib/student/studentMonthlyPaymentsStripState";

type GridLegend = Dictionary["dashboard"]["student"]["paymentsPwa"]["legend"];
type PwaSectionLabels = Pick<
  Dictionary["dashboard"]["student"]["paymentsPwa"],
  | "expandSection"
  | "collapseSection"
  | "monthsToPayTitle"
  | "monthDetailHint"
  | "detailPanelTitle"
  | "enrollmentFeeChipLabel"
>;

export interface StudentMonthlyPaymentsPwaAccordionListProps {
  locale: Locale;
  studentId: string;
  sortedRows: StudentMonthlyPaymentSectionRow[];
  monthLabels: string[];
  labels: Dictionary["dashboard"]["student"]["monthly"];
  paymentLabels: Dictionary["dashboard"]["student"];
  gridLegendLabels: GridLegend;
  pwaSectionLabels: PwaSectionLabels;
  hideNonBillableMonths: boolean;
  expandedBySection: Record<string, boolean>;
  onExpandedBySectionChange: (sectionId: string, open: boolean) => void;
  focus: StudentMonthlyPaymentsStripFocus | null;
  onFocusChange: (next: StudentMonthlyPaymentsStripFocus | null) => void;
  submitAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  receiptExpectedUsesFullMonth: boolean;
  fileUploadProgress: FileUploadProgressLabels;
  startFlowMonthlyPaymentAction?: StartFlowMonthlyPaymentClientAction;
  flowMonthlyPayEnabled: boolean;
  tutorPaymentMethodTabs: boolean;
}

export function StudentMonthlyPaymentsPwaAccordionList({
  locale,
  studentId,
  sortedRows,
  monthLabels,
  labels,
  paymentLabels,
  gridLegendLabels,
  pwaSectionLabels,
  hideNonBillableMonths,
  expandedBySection,
  onExpandedBySectionChange,
  focus,
  onFocusChange,
  submitAction,
  submitEnrollmentFeeReceiptAction,
  receiptExpectedUsesFullMonth,
  fileUploadProgress,
  startFlowMonthlyPaymentAction,
  flowMonthlyPayEnabled,
  tutorPaymentMethodTabs,
}: StudentMonthlyPaymentsPwaAccordionListProps) {
  const router = useRouter();
  const filterOpts = { hideNonBillableMonths };

  return (
    <section className="mt-6 space-y-3" aria-label={labels.stripAria}>
      {sortedRows.map((row) => {
        const isFocusedSection = focus?.sectionId === row.sectionId;
        const isEnrollmentFocus = isFocusedSection && focus?.enrollment === true;
        const focusMonth =
          isFocusedSection && focus?.month != null && !focus.enrollment ? focus.month : null;
        const sectionSettled = isSectionMonthlyPaymentsFullySettled(row);
        const visibleCells = filterMonthlyStripVisibleCells(row.cells, filterOpts);
        const cell = focusMonth != null ? monthlyStripFindCell(row, focusMonth) : null;

        return (
          <MonthlyPaymentsSectionAccordion
            key={row.sectionId}
            locale={locale}
            studentId={studentId}
            row={row}
            sectionSettled={sectionSettled}
            isExpanded={expandedBySection[row.sectionId] ?? !sectionSettled}
            onExpandedChange={(open) => onExpandedBySectionChange(row.sectionId, open)}
            expandLabel={pwaSectionLabels.expandSection}
            collapseLabel={pwaSectionLabels.collapseSection}
            visibleCells={visibleCells}
            monthLabels={monthLabels}
            labels={labels}
            paymentLabels={paymentLabels}
            gridLegendLabels={gridLegendLabels}
            monthsToPayTitle={pwaSectionLabels.monthsToPayTitle}
            monthDetailHint={pwaSectionLabels.monthDetailHint}
            detailPanelTitle={pwaSectionLabels.detailPanelTitle}
            enrollmentFeeChipLabel={pwaSectionLabels.enrollmentFeeChipLabel}
            stripAria={labels.stripAria}
            isFocusedSection={isFocusedSection}
            isEnrollmentFocus={isEnrollmentFocus}
            focusMonth={focusMonth}
            onFocusMonth={(month) => {
              onFocusChange(
                focus?.sectionId === row.sectionId && focus.month === month && !focus.enrollment
                  ? null
                  : { sectionId: row.sectionId, month },
              );
            }}
            onFocusEnrollment={() => {
              onFocusChange(
                focus?.sectionId === row.sectionId && focus.enrollment
                  ? null
                  : { sectionId: row.sectionId, enrollment: true },
              );
            }}
            focusedCell={cell}
            submitAction={submitAction}
            submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
            receiptExpectedUsesFullMonth={receiptExpectedUsesFullMonth}
            fileUploadProgress={fileUploadProgress}
            startFlowMonthlyPaymentAction={startFlowMonthlyPaymentAction}
            flowMonthlyPayEnabled={flowMonthlyPayEnabled}
            tutorPaymentMethodTabs={tutorPaymentMethodTabs}
            onSubmitted={() => router.refresh()}
          />
        );
      })}
      <MonthlyPaymentsGridLegend
        gridLegendLabels={gridLegendLabels}
        hideNonBillableMonths={hideNonBillableMonths}
      />
    </section>
  );
}
