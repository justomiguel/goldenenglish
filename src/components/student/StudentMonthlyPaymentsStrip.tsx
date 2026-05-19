"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type SubmitMonthlyReceiptAction,
  type StartFlowMonthlyPaymentClientAction,
} from "@/components/student/StudentMonthlyPaymentFocus";
import type { SubmitEnrollmentFeeReceiptAction } from "@/components/molecules/StudentEnrollmentFeeUpload";
import { MonthlyPaymentsGridLegend } from "@/components/student/MonthlyPaymentsGridLegend";
import { StudentMonthlyPaymentsDesktopSection } from "@/components/student/StudentMonthlyPaymentsDesktopSection";
import { StudentMonthlyPaymentsPwaAccordionList } from "@/components/student/StudentMonthlyPaymentsPwaAccordionList";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { StudentMonthlyPaymentsView } from "@/types/studentMonthlyPayments";
import { filterMonthlyStripVisibleCells } from "@/lib/billing/filterMonthlyStripVisibleCells";
import { isSectionMonthlyPaymentsFullySettled } from "@/lib/billing/isSectionMonthlyPaymentsFullySettled";
import { sortMonthlyPaymentSectionRows } from "@/lib/billing/sortMonthlyPaymentSectionRows";
import { monthlyStripFindCell } from "@/lib/student/studentMonthlyPaymentsStripHelpers";
import {
  buildDefaultExpandedBySection,
  monthlyStripMonthLabels,
  pickInitialMonthlyStripFocus,
  type StudentMonthlyPaymentsStripFocus,
} from "@/lib/student/studentMonthlyPaymentsStripState";

export type { StudentMonthlyPaymentsStripFocus };

export interface StudentMonthlyPaymentsStripProps {
  locale: Locale;
  studentId: string;
  view: StudentMonthlyPaymentsView;
  labels: Dictionary["dashboard"]["student"]["monthly"];
  paymentLabels: Dictionary["dashboard"]["student"];
  submitAction: SubmitMonthlyReceiptAction;
  submitEnrollmentFeeReceiptAction: SubmitEnrollmentFeeReceiptAction;
  receiptExpectedUsesFullMonth?: boolean;
  startFlowMonthlyPaymentAction?: StartFlowMonthlyPaymentClientAction;
  flowMonthlyPayEnabled?: boolean;
  fileUploadProgress: FileUploadProgressLabels;
  tutorPaymentMethodTabs?: boolean;
  initialFocus?: StudentMonthlyPaymentsStripFocus | null;
  hideNonBillableMonths?: boolean;
  pwaSectionAccordion?: boolean;
  gridLegendLabels?: Dictionary["dashboard"]["student"]["paymentsPwa"]["legend"];
  pwaSectionLabels?: Pick<
    Dictionary["dashboard"]["student"]["paymentsPwa"],
    | "expandSection"
    | "collapseSection"
    | "monthsToPayTitle"
    | "monthDetailHint"
    | "detailPanelTitle"
    | "enrollmentFeeChipLabel"
  >;
}

export function StudentMonthlyPaymentsStrip({
  locale,
  studentId,
  view,
  labels,
  paymentLabels,
  submitAction,
  submitEnrollmentFeeReceiptAction,
  receiptExpectedUsesFullMonth = false,
  fileUploadProgress,
  startFlowMonthlyPaymentAction,
  flowMonthlyPayEnabled = false,
  tutorPaymentMethodTabs = false,
  initialFocus = null,
  hideNonBillableMonths = false,
  pwaSectionAccordion = false,
  gridLegendLabels,
  pwaSectionLabels,
}: StudentMonthlyPaymentsStripProps) {
  const router = useRouter();
  const sortedRows = useMemo(
    () =>
      pwaSectionAccordion
        ? sortMonthlyPaymentSectionRows(view.rows, isSectionMonthlyPaymentsFullySettled)
        : view.rows,
    [view.rows, pwaSectionAccordion],
  );
  const isPwaAccordion = Boolean(pwaSectionAccordion && gridLegendLabels && pwaSectionLabels);
  const [expandedBySection, setExpandedBySection] = useState<Record<string, boolean>>(() =>
    pwaSectionAccordion ? buildDefaultExpandedBySection(sortedRows) : {},
  );
  const [focus, setFocus] = useState<StudentMonthlyPaymentsStripFocus | null>(() => {
    if (pwaSectionAccordion) return null;
    if (initialFocus != null) return initialFocus;
    return pickInitialMonthlyStripFocus(sortedRows, hideNonBillableMonths, view.todayMonth);
  });

  const monthLabels = useMemo(() => monthlyStripMonthLabels(locale), [locale]);

  if (view.rows.length === 0) {
    return (
      <section className="mt-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-muted-foreground)]">
        {labels.emptySections}
      </section>
    );
  }

  const filterOpts = { hideNonBillableMonths };

  if (isPwaAccordion && pwaSectionLabels && gridLegendLabels) {
    return (
      <StudentMonthlyPaymentsPwaAccordionList
        locale={locale}
        studentId={studentId}
        sortedRows={sortedRows}
        monthLabels={monthLabels}
        labels={labels}
        paymentLabels={paymentLabels}
        gridLegendLabels={gridLegendLabels}
        pwaSectionLabels={pwaSectionLabels}
        hideNonBillableMonths={hideNonBillableMonths}
        expandedBySection={expandedBySection}
        onExpandedBySectionChange={(sectionId, open) =>
          setExpandedBySection((prev) => ({ ...prev, [sectionId]: open }))
        }
        focus={focus}
        onFocusChange={setFocus}
        submitAction={submitAction}
        submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
        receiptExpectedUsesFullMonth={receiptExpectedUsesFullMonth}
        fileUploadProgress={fileUploadProgress}
        startFlowMonthlyPaymentAction={startFlowMonthlyPaymentAction}
        flowMonthlyPayEnabled={flowMonthlyPayEnabled}
        tutorPaymentMethodTabs={tutorPaymentMethodTabs}
      />
    );
  }

  const paymentsLegend = gridLegendLabels ? (
    <MonthlyPaymentsGridLegend
      gridLegendLabels={gridLegendLabels}
      hideNonBillableMonths={hideNonBillableMonths}
    />
  ) : null;

  return (
    <section className="mt-6 space-y-6" aria-label={labels.stripAria}>
      {view.rows.map((row) => {
        const isFocusedSection = focus?.sectionId === row.sectionId;
        const focusMonth =
          isFocusedSection && focus?.month != null && !focus.enrollment ? focus.month : null;
        const sectionSettled = isSectionMonthlyPaymentsFullySettled(row);
        const visibleCells = filterMonthlyStripVisibleCells(row.cells, filterOpts);
        const cell = focusMonth != null ? monthlyStripFindCell(row, focusMonth) : null;
        return (
          <StudentMonthlyPaymentsDesktopSection
            key={row.sectionId}
            locale={locale}
            studentId={studentId}
            row={row}
            sectionSettled={sectionSettled}
            visibleCells={visibleCells}
            monthLabels={monthLabels}
            labels={labels}
            paymentLabels={paymentLabels}
            gridLegendLabels={gridLegendLabels}
            stripAria={labels.stripAria}
            isFocusedSection={isFocusedSection}
            focusMonth={focusMonth}
            focusedCell={cell}
            onFocusMonth={(month) => setFocus({ sectionId: row.sectionId, month })}
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
      {paymentsLegend}
    </section>
  );
}
