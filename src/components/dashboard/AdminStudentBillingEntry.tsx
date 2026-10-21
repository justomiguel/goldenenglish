"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { AdminBackLink } from "@/components/dashboard/AdminBackLink";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import type { Locale } from "@/types/i18n";
import type { Dictionary } from "@/types/i18n";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
  AdminStudentBillingSectionBenefit,
} from "@/types/adminStudentBilling";

type BillingLabels = Dictionary["admin"]["billing"];
type UserLabels = Dictionary["admin"]["users"];

interface AdminStudentBillingEntryProps {
  locale: Locale;
  studentId: string;
  studentName: string;
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  sectionBenefits: AdminStudentBillingSectionBenefit[];
  labels: BillingLabels;
  usersLabels: UserLabels;
  enrollmentFeeExempt: boolean;
  enrollmentExemptReason: string | null;
  lastEnrollmentPaidAt: string | null;
  defaultYear: number;
}

export function AdminStudentBillingEntry({
  locale,
  studentId,
  studentName,
  payments,
  scholarships,
  sectionBenefits,
  labels,
  usersLabels,
  enrollmentFeeExempt,
  enrollmentExemptReason,
  lastEnrollmentPaidAt,
  defaultYear,
}: AdminStudentBillingEntryProps) {
  const backHref = `/${locale}/dashboard/admin/users/${studentId}`;

  const inner = (
    <>
      <AdminBackLink href={backHref}>{usersLabels.detailBack}</AdminBackLink>
      <AdminStudentBillingClient
        locale={locale}
        studentId={studentId}
        studentName={studentName}
        payments={payments}
        scholarships={scholarships}
        sectionBenefits={sectionBenefits}
        labels={labels}
        enrollmentFeeExempt={enrollmentFeeExempt}
        enrollmentExemptReason={enrollmentExemptReason}
        lastEnrollmentPaidAt={lastEnrollmentPaidAt}
        defaultYear={defaultYear}
      />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={
        <div className="animate-pulse space-y-4" aria-hidden>
          <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
        </div>
      }
      desktop={<div className="mx-auto max-w-4xl space-y-6">{inner}</div>}
      narrow={() => (
        <div className="mx-auto max-w-[var(--layout-max-width)] space-y-3">{inner}</div>
      )}
    />
  );
}
