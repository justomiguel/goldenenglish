"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import type { Locale } from "@/types/i18n";
import type { AppSurface } from "@/hooks/useAppSurface";
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
      <Link
        href={backHref}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-secondary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {usersLabels.detailBack}
      </Link>
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
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{inner}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}
