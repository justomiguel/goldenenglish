"use client";

import { useMemo, useState } from "react";
import { AdminBillingSectionFeeSummary } from "@/components/dashboard/AdminBillingSectionFeeSummary";
import { AdminRecordPaymentPanel } from "@/components/dashboard/AdminRecordPaymentPanel";
import { DEFAULT_SECTION_FEE_PLAN_CURRENCY } from "@/types/sectionFeePlan";
import { AdminStudentBillingTabsPanel } from "@/components/dashboard/AdminStudentBillingTabsPanel";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import { computeAdminStudentBillingMonthMatrix } from "@/lib/billing/computeAdminStudentBillingMonthMatrix";
import { enrollmentFeeMatrixVisualFromAdminBillingBenefit } from "@/lib/billing/enrollmentFeeMatrixVisual";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

interface AdminStudentBillingClientProps {
  locale: Locale;
  studentId: string;
  studentName: string;
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  sectionBenefits: AdminStudentBillingSectionBenefit[];
  labels: BillingLabels;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  defaultYear: number;
}

export function AdminStudentBillingClient({
  locale,
  studentId,
  studentName,
  payments,
  scholarships,
  sectionBenefits,
  labels,
  enrollmentFeeExempt,
  enrollmentExemptReason,
  lastEnrollmentPaidAt,
  defaultYear,
}: AdminStudentBillingClientProps) {
  const [billingYear, setBillingYear] = useState(defaultYear);
  const [selectedSectionId, setSelectedSectionId] = useState(
    sectionBenefits[0]?.sectionId ?? "",
  );
  const [todayYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const selectedBenefit =
    sectionBenefits.find((s) => s.sectionId === selectedSectionId) ??
    sectionBenefits[0] ??
    null;

  const visiblePayments = selectedBenefit
    ? payments.filter(
        (p) => p.section_id === selectedBenefit.sectionId || p.section_id === null,
      )
    : payments;
  const selectedScholarships = selectedBenefit ? selectedBenefit.scholarships : scholarships;
  const { monthStates, collectionCells } = useMemo(() => {
    if (!selectedBenefit) {
      return { monthStates: [] as AdminBillingMonthState[], collectionCells: null };
    }
    return computeAdminStudentBillingMonthMatrix({
      benefit: selectedBenefit,
      payments,
      scholarships: selectedScholarships,
      billingYear,
      calendarTodayYear: todayYm.year,
      calendarTodayMonth: todayYm.month,
    });
  }, [billingYear, payments, selectedBenefit, selectedScholarships, todayYm.month, todayYm.year]);
  const paidMonths = monthStates.filter((s) => s.status === "paid").length;
  const selectableMonths = monthStates.filter((s) => s.selectable).length;

  const enrollmentMonthZeroVisual = useMemo(() => {
    if (!selectedBenefit || selectedBenefit.sectionEnrollmentFeeAmount <= 0) return null;
    return enrollmentFeeMatrixVisualFromAdminBillingBenefit(selectedBenefit, {
      sectionStartsOn: selectedBenefit.sectionStartsOn,
      enrolledAt: selectedBenefit.enrollmentCreatedAt,
      todayYear: todayYm.year,
      todayMonth: todayYm.month,
    });
  }, [selectedBenefit, todayYm.month, todayYm.year]);

  return (
    <div className="space-y-4">
      <header className="space-y-0.5">
        <h1 className="text-xl font-bold text-[var(--color-secondary)] md:text-2xl">
          {labels.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.lead}: <strong>{studentName}</strong>
        </p>
      </header>

      <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
        <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_140px_auto] md:items-start">
          {sectionBenefits.length > 0 ? (
            <div className="min-w-0 space-y-3">
              <div>
                <label
                  htmlFor="billing-section-select"
                  className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
                >
                  {labels.sectionBenefitSelect}
                </label>
                <select
                  id="billing-section-select"
                  value={selectedSectionId}
                  disabled={sectionBenefits.length === 1}
                  onChange={(event) => setSelectedSectionId(event.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] disabled:opacity-70"
                >
                  {sectionBenefits.map((section) => (
                    <option key={section.sectionId} value={section.sectionId}>
                      {section.sectionName}
                    </option>
                  ))}
                </select>
              </div>
              {selectedBenefit ? (
                <AdminBillingSectionFeeSummary
                  locale={locale}
                  enrollmentAmount={selectedBenefit.sectionEnrollmentFeeAmount}
                  enrollmentCurrency={
                    selectedBenefit.sectionMonthlyFeeCurrency ?? DEFAULT_SECTION_FEE_PLAN_CURRENCY
                  }
                  monthlyAmount={selectedBenefit.sectionMonthlyFeeAmount}
                  monthlyCurrency={selectedBenefit.sectionMonthlyFeeCurrency}
                  labels={{
                    enrollmentLabel: labels.billingFeeSummaryEnrollmentLabel,
                    monthlyLabel: labels.billingFeeSummaryMonthlyLabel,
                    monthlyUnavailable: labels.billingFeeSummaryMonthlyUnavailable,
                    enrollmentNotCharged: labels.billingFeeSummaryEnrollmentNotCharged,
                  }}
                />
              ) : null}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="billing-year-select"
              className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
            >
              {labels.periodYear}
            </label>
            <input
              id="billing-year-select"
              type="number"
              min={2000}
              max={2100}
              value={billingYear}
              onChange={(event) => setBillingYear(Number(event.target.value))}
              className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
            />
          </div>
          <p className="rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]/35 px-3 py-2 text-sm font-semibold text-[var(--color-secondary)]">
            {labels.billingMonthSummary
              .replace("{paid}", String(paidMonths))
              .replace("{total}", String(monthStates.length))
              .replace("{open}", String(selectableMonths))}
          </p>
        </div>

        {selectedBenefit ? (
          <AdminRecordPaymentPanel
            key={`record-${selectedBenefit.sectionId}-${billingYear}`}
            embedded
            locale={locale}
            studentId={studentId}
            studentName={studentName}
            sectionId={selectedBenefit.sectionId}
            sectionName={selectedBenefit.sectionName}
            year={billingYear}
            monthStates={monthStates}
            collectionCells={collectionCells}
            labels={labels}
            showEnrollmentMonthZero={selectedBenefit.sectionEnrollmentFeeAmount > 0}
            enrollmentMonthZeroVisual={enrollmentMonthZeroVisual}
            enrollmentFeeModal={
              selectedBenefit.sectionEnrollmentFeeAmount > 0
                ? {
                    enrollmentId: selectedBenefit.enrollmentId,
                    enrollmentFeeExempt: selectedBenefit.enrollmentFeeExempt,
                    enrollmentExemptReason: selectedBenefit.enrollmentExemptReason,
                    lastEnrollmentPaidAt: selectedBenefit.lastEnrollmentPaidAt,
                    receiptSignedUrl: selectedBenefit.enrollmentFeeReceiptSignedUrl,
                    receiptStatus: selectedBenefit.enrollmentFeeReceiptStatus,
                  }
                : null
            }
          />
        ) : null}
      </section>

      <AdminStudentBillingTabsPanel
        locale={locale}
        studentId={studentId}
        labels={labels}
        selectedBenefit={selectedBenefit}
        visiblePayments={visiblePayments}
        selectedScholarships={selectedScholarships}
        enrollmentFeeExempt={enrollmentFeeExempt}
        enrollmentExemptReason={enrollmentExemptReason}
        lastEnrollmentPaidAt={lastEnrollmentPaidAt}
      />
    </div>
  );
}
