"use client";

import { useMemo, useState } from "react";
import { AdminAnnualSettlementPanel } from "@/components/dashboard/AdminAnnualSettlementPanel";
import { AdminStudentPersonMonthlyDue } from "@/components/dashboard/AdminStudentPersonMonthlyDue";
import { AdminRecordPaymentPanel } from "@/components/dashboard/AdminRecordPaymentPanel";
import { AdminStudentBillingPeriodControls } from "@/components/dashboard/AdminStudentBillingPeriodControls";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminStudentBillingTabsPanel } from "@/components/dashboard/AdminStudentBillingTabsPanel";
import type { AdminBillingMonthState } from "@/lib/billing/buildAdminBillingMonthGrid";
import { computeAdminStudentBillingMonthMatrix } from "@/lib/billing/computeAdminStudentBillingMonthMatrix";
import { discountedAverageMonthlyFeeFromCells } from "@/lib/billing/discountedAverageMonthlyFeeFromCells";
import {
  monthlyDueLinesFromSectionBenefits,
  sumDiscountedMonthlyDue,
} from "@/lib/billing/sumDiscountedMonthlyDue";
import { enrollmentFeeMatrixVisualFromAdminBillingBenefit } from "@/lib/billing/enrollmentFeeMatrixVisual";
import {
  filterPaymentsForCohort,
  preferActiveSectionBenefits,
  type StudentFichaCohortOption,
} from "@/lib/dashboard/studentFichaCohort";
import { AdminStudentCohortSelect } from "@/components/molecules/AdminStudentCohortSelect";
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
  cohortOptions?: StudentFichaCohortOption[];
  selectedCohortId?: string | null;
  onCohortChange?: (cohortId: string) => void;
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
  cohortOptions = [],
  selectedCohortId = null,
  onCohortChange,
}: AdminStudentBillingClientProps) {
  const [billingYear, setBillingYear] = useState(defaultYear);
  const [billingYearRaw, setBillingYearRaw] = useState(String(defaultYear));
  const [selectedSectionId, setSelectedSectionId] = useState(
    sectionBenefits[0]?.sectionId ?? "",
  );
  const [todayYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const visibleBenefits = useMemo(() => {
    if (!selectedCohortId) return sectionBenefits;
    return preferActiveSectionBenefits(
      sectionBenefits.filter((benefit) => benefit.cohortId === selectedCohortId),
    );
  }, [sectionBenefits, selectedCohortId]);
  const cohortPayments = useMemo(() => {
    if (!selectedCohortId) return payments;
    return filterPaymentsForCohort(
      payments,
      new Set(visibleBenefits.map((benefit) => benefit.sectionId)),
    );
  }, [payments, selectedCohortId, visibleBenefits]);

  const effectiveSectionId = visibleBenefits.some((benefit) => benefit.sectionId === selectedSectionId)
    ? selectedSectionId
    : (visibleBenefits[0]?.sectionId ?? "");

  const selectedBenefit =
    visibleBenefits.find((s) => s.sectionId === effectiveSectionId) ?? null;

  const visiblePayments = selectedBenefit
    ? cohortPayments.filter((p) => p.section_id === selectedBenefit.sectionId || (!selectedCohortId && p.section_id === null))
    : cohortPayments;
  const selectedScholarships = selectedBenefit ? selectedBenefit.scholarships : scholarships;
  const { monthStates, collectionCells } = useMemo(() => {
    if (!selectedBenefit) {
      return { monthStates: [] as AdminBillingMonthState[], collectionCells: null };
    }
    return computeAdminStudentBillingMonthMatrix({
      benefit: selectedBenefit,
      payments: selectedCohortId ? visiblePayments : payments,
      scholarships: selectedScholarships,
      billingYear,
      calendarTodayYear: todayYm.year,
      calendarTodayMonth: todayYm.month,
    });
  }, [billingYear, payments, selectedBenefit, selectedCohortId, selectedScholarships, todayYm.month, todayYm.year, visiblePayments]);
  const personMonthlyDue = useMemo(
    () =>
      sumDiscountedMonthlyDue(
        monthlyDueLinesFromSectionBenefits(visibleBenefits, todayYm.year, todayYm.month),
      ),
    [visibleBenefits, todayYm.month, todayYm.year],
  );

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
        <h1
          className="text-xl font-bold text-[var(--color-secondary)] md:text-2xl"
          data-tour={ADMIN_TOUR_ANCHORS.userBillingTitle}
        >
          {labels.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.lead}: <strong>{studentName}</strong>
        </p>
      </header>

      <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:p-4">
        {onCohortChange && selectedCohortId ? (
          <AdminStudentCohortSelect
            id="billing-cohort-select"
            label={labels.cohortSelect}
            currentMark={labels.cohortCurrentMark}
            options={cohortOptions}
            value={selectedCohortId}
            onChange={onCohortChange}
          />
        ) : null}
        {selectedCohortId && visibleBenefits.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.cohortEmpty}</p>
        ) : null}
        {visibleBenefits.length > 0 ? (
          <AdminStudentPersonMonthlyDue
            locale={locale}
            totals={personMonthlyDue}
            label={labels.billingPersonMonthlyTotalLabel}
            unavailable={labels.billingPersonMonthlyTotalUnavailable}
          />
        ) : null}
        <AdminStudentBillingPeriodControls
          locale={locale}
          labels={labels}
          sectionBenefits={visibleBenefits}
          selectedSectionId={effectiveSectionId}
          onSelectSection={setSelectedSectionId}
          selectedBenefit={selectedBenefit}
          effectiveMonthlyAmount={discountedAverageMonthlyFeeFromCells(collectionCells)}
          billingYearRaw={billingYearRaw}
          onBillingYearRawChange={(raw) => {
            setBillingYearRaw(raw);
            const next = Number(raw);
            if (Number.isInteger(next) && next >= 2000 && next <= 2100) {
              setBillingYear(next);
            }
          }}
          paidMonths={paidMonths}
          monthCount={monthStates.length}
          selectableMonths={selectableMonths}
        />

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
            sectionMonthlyFeeAmount={selectedBenefit.sectionMonthlyFeeAmount}
            sectionMonthlyFeeCurrency={selectedBenefit.sectionMonthlyFeeCurrency}
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

      {selectedBenefit ? (
        <AdminAnnualSettlementPanel
          locale={locale}
          studentId={studentId}
          benefit={selectedBenefit}
          billingYear={billingYear}
          labels={labels.annualSettlement}
          cancelLabel={labels.cancel}
        />
      ) : null}

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
