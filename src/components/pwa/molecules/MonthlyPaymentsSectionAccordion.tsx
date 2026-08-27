"use client";

import { ChevronDown } from "lucide-react";
import { StudentMonthlyPaymentCell } from "@/components/student/StudentMonthlyPaymentCell";
import { StudentMonthlyEnrollmentFeeCell } from "@/components/pwa/molecules/StudentMonthlyEnrollmentFeeCell";
import { StudentMonthlyPaymentFocus } from "@/components/student/StudentMonthlyPaymentFocus";
import { MonthlyPaymentsSectionEnrollmentDetail } from "@/components/pwa/molecules/MonthlyPaymentsSectionEnrollmentDetail";
import { MonthlyPaymentsPwaNestedDetail } from "@/components/pwa/molecules/MonthlyPaymentsPwaNestedDetail";
import { ParentMonthlyPayReviewCta } from "@/components/parent/ParentMonthlyPayReviewCta";
import {
  resolveEnrollmentFeeChipStatus,
  sectionShowsEnrollmentFeeChip,
} from "@/lib/billing/resolveEnrollmentFeeChipStatus";
import type { MonthlyPaymentsSectionAccordionProps } from "@/components/pwa/molecules/MonthlyPaymentsSectionAccordion.types";

export type { MonthlyPaymentsSectionAccordionProps };

export function MonthlyPaymentsSectionAccordion({
  locale,
  studentId,
  row,
  sectionSettled,
  isExpanded,
  onExpandedChange,
  expandLabel,
  collapseLabel,
  visibleCells,
  monthLabels,
  labels,
  paymentLabels,
  gridLegendLabels,
  monthsToPayTitle,
  monthDetailHint,
  detailPanelTitle,
  enrollmentFeeChipLabel,
  stripAria,
  isFocusedSection,
  isEnrollmentFocus,
  focusMonth,
  onFocusMonth,
  onFocusEnrollment,
  focusedCell,
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
  parentReviewHref,
  parentReviewCtaLabel,
}: MonthlyPaymentsSectionAccordionProps) {
  const panelId = `payments-section-panel-${row.sectionId}`;
  const toggleAria = isExpanded ? collapseLabel : expandLabel;
  const enrollmentChipStatus = resolveEnrollmentFeeChipStatus(row);
  const showEnrollmentChip = sectionShowsEnrollmentFeeChip(row);
  const showDetailHint = !focusedCell && !isEnrollmentFocus;

  return (
    <div
      className={
        sectionSettled
          ? "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/45 bg-[var(--color-success)]/10 shadow-[var(--shadow-card)]"
          : "overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
      }
    >
      <button
        type="button"
        className="flex min-h-[44px] w-full items-start justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={isExpanded}
        aria-controls={panelId}
        onClick={() => onExpandedChange(!isExpanded)}
      >
        <span className="min-w-0 flex-1">
          <span className="font-display text-base font-semibold text-[var(--color-secondary)]">
            {row.sectionName}
          </span>
          {row.cohortName ? (
            <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">
              {row.cohortName}
            </span>
          ) : null}
          {sectionSettled ? (
            <span className="mt-1 block text-xs font-medium text-[var(--color-success)]">
              {gridLegendLabels.sectionSettled}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--color-muted-foreground)] transition ${isExpanded ? "rotate-180" : ""} ${sectionSettled ? "text-[var(--color-success)]" : ""}`}
          aria-hidden
        />
        <span className="sr-only">{toggleAria}</span>
      </button>

      {isExpanded ? (
        <div
          id={panelId}
          className={
            sectionSettled
              ? "border-t border-[var(--color-success)]/30 px-4 pb-4 pt-3"
              : "border-t border-[var(--color-border)]/80 px-4 pb-4 pt-3"
          }
        >
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-secondary)]">
            {monthsToPayTitle}
          </h3>
          <div
            role="grid"
            aria-label={`${row.sectionName} ${stripAria}`}
            className="flex flex-wrap items-end justify-center gap-2"
          >
            {showEnrollmentChip && enrollmentChipStatus ? (
              <StudentMonthlyEnrollmentFeeCell
                chipLabel={enrollmentFeeChipLabel}
                status={enrollmentChipStatus}
                labels={labels}
                isFocused={isEnrollmentFocus}
                onFocus={onFocusEnrollment}
              />
            ) : null}
            {visibleCells.map((cell) => (
              <StudentMonthlyPaymentCell
                key={`${row.sectionId}-${cell.month}`}
                cell={cell}
                monthLabel={monthLabels[cell.month - 1]!}
                labels={labels}
                isFocused={isFocusedSection && focusMonth === cell.month}
                onFocus={() => onFocusMonth(cell.month)}
                emphasizeCurrentMonth
              />
            ))}
          </div>

          {showDetailHint ? (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]" role="note">
              {monthDetailHint}
            </p>
          ) : null}

          {!row.hasActivePlan ? (
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{labels.noPlanHint}</p>
          ) : null}

          {isFocusedSection && focusedCell && focusMonth != null ? (
            <MonthlyPaymentsPwaNestedDetail
              title={detailPanelTitle.replace(
                "{label}",
                `${monthLabels[focusedCell.month - 1]!} ${focusedCell.year}`,
              )}
            >
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
                pwaNestedHierarchy
                bankTransferInstructions={bankTransferInstructions}
                onSubmitted={onSubmitted} hidePayMethods={Boolean(parentReviewHref)}
              />
              {parentReviewHref &&
              parentReviewCtaLabel &&
              (focusedCell.status === "due" || focusedCell.status === "rejected") ? (
                <ParentMonthlyPayReviewCta
                  href={parentReviewHref(row.sectionId, focusedCell.month, focusedCell.year)}
                  label={parentReviewCtaLabel}
                />
              ) : null}
            </MonthlyPaymentsPwaNestedDetail>
          ) : null}

          {isEnrollmentFocus ? (
            <MonthlyPaymentsSectionEnrollmentDetail
              locale={locale}
              studentId={studentId}
              row={row}
              detailPanelTitle={detailPanelTitle}
              enrollmentFeeChipLabel={enrollmentFeeChipLabel}
              labels={labels}
              fileUploadProgress={fileUploadProgress}
              submitEnrollmentFeeReceiptAction={submitEnrollmentFeeReceiptAction}
              onSubmitted={onSubmitted}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}