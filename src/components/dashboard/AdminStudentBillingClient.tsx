"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/periodExemptionActions";
import { AdminEnrollmentFeeExemption } from "@/components/dashboard/AdminEnrollmentFeeExemption";
import { AdminStudentBillingPaymentsTable } from "@/components/dashboard/AdminStudentBillingPaymentsTable";
import { AdminStudentBillingPeriodExemptionsPanel } from "@/components/dashboard/AdminStudentBillingPeriodExemptionsPanel";
import { AdminStudentBillingScholarshipPanel } from "@/components/dashboard/AdminStudentBillingScholarshipPanel";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

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
}: AdminStudentBillingClientProps) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState(
    sectionBenefits[0]?.sectionId ?? "",
  );
  const selectedBenefit =
    sectionBenefits.find((section) => section.sectionId === selectedSectionId) ??
    sectionBenefits[0] ??
    null;
  const exemptSectionNames = sectionBenefits
    .filter((section) => section.enrollmentFeeExempt)
    .map((section) => section.sectionName);

  const visiblePayments = selectedBenefit
    ? payments.filter(
        (p) => p.section_id === selectedBenefit.sectionId || p.section_id === null,
      )
    : payments;
  const selectedScholarships = selectedBenefit ? selectedBenefit.scholarships : scholarships;

  async function toggleExempt(period: { year: number; month: number }, exempt: boolean) {
    setBusy(true);
    setMsg(null);
    const res = await setPeriodExemption({
      locale,
      studentId,
      sectionId: selectedBenefit?.sectionId,
      year: period.year,
      month: period.month,
      exempt,
    });
    setBusy(false);
    setMsg(res.ok ? labels.exemptionUpdated : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          {labels.lead}: <strong>{studentName}</strong>
        </p>
      </div>

      {msg ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}

      {sectionBenefits.length > 0 ? (
        <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label
            htmlFor="billing-section-select"
            className="text-sm font-semibold text-[var(--color-secondary)]"
          >
            {labels.sectionBenefitSelect}
          </label>
          <select
            id="billing-section-select"
            value={selectedSectionId}
            disabled={sectionBenefits.length === 1}
            onChange={(event) => setSelectedSectionId(event.target.value)}
            className="mt-2 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] disabled:opacity-70"
          >
            {sectionBenefits.map((section) => (
              <option key={section.sectionId} value={section.sectionId}>
                {section.enrollmentFeeExempt
                  ? labels.sectionBenefitOptionExempt.replace("{section}", section.sectionName)
                  : section.sectionName}
              </option>
            ))}
          </select>
          {exemptSectionNames.length > 0 ? (
            <p className="mt-2 text-sm font-medium text-[var(--color-info)]">
              {labels.enrollmentExemptSections.replace(
                "{sections}",
                exemptSectionNames.join(", "),
              )}
            </p>
          ) : null}
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
            {labels.sectionBenefitSelectHelp}
          </p>
        </section>
      ) : null}

      <AdminEnrollmentFeeExemption
        key={`enrollment-${selectedBenefit?.sectionId ?? "global"}`}
        locale={locale}
        studentId={studentId}
        enrollmentId={selectedBenefit?.enrollmentId ?? null}
        sectionId={selectedBenefit?.sectionId ?? null}
        sectionName={selectedBenefit?.sectionName ?? null}
        labels={labels}
        initialExempt={selectedBenefit ? selectedBenefit.enrollmentFeeExempt : enrollmentFeeExempt}
        initialReason={selectedBenefit ? selectedBenefit.enrollmentExemptReason : enrollmentExemptReason}
        initialLastPaidAt={selectedBenefit ? selectedBenefit.lastEnrollmentPaidAt : lastEnrollmentPaidAt}
        receiptSignedUrl={selectedBenefit?.enrollmentFeeReceiptSignedUrl ?? null}
        receiptStatus={selectedBenefit?.enrollmentFeeReceiptStatus ?? null}
      />

      <AdminStudentBillingScholarshipPanel
        key={`scholarship-${selectedBenefit?.sectionId ?? "global"}`}
        locale={locale}
        studentId={studentId}
        sectionId={selectedBenefit?.sectionId ?? null}
        sectionName={selectedBenefit?.sectionName ?? null}
        scholarships={selectedScholarships}
        labels={labels}
        busy={busy}
        setBusy={setBusy}
        setMsg={setMsg}
      />

      <AdminStudentBillingPeriodExemptionsPanel
        key={`exemptions-${selectedBenefit?.sectionId ?? "global"}`}
        locale={locale}
        studentId={studentId}
        sectionId={selectedBenefit?.sectionId ?? null}
        sectionName={selectedBenefit?.sectionName ?? null}
        labels={labels}
        busy={busy}
        setBusy={setBusy}
        setMsg={setMsg}
      />

      <AdminStudentBillingPaymentsTable
        payments={visiblePayments}
        scholarships={selectedScholarships}
        labels={labels}
        busy={busy}
        onToggleExempt={toggleExempt}
      />
    </div>
  );
}
