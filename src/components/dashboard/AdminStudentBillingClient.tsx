"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPeriodExemption } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/actions";
import { AdminEnrollmentFeeExemption } from "@/components/dashboard/AdminEnrollmentFeeExemption";
import { AdminStudentBillingPaymentsTable } from "@/components/dashboard/AdminStudentBillingPaymentsTable";
import { AdminStudentBillingPeriodExemptionsPanel } from "@/components/dashboard/AdminStudentBillingPeriodExemptionsPanel";
import { AdminStudentBillingScholarshipPanel } from "@/components/dashboard/AdminStudentBillingScholarshipPanel";
import type { AdminBillingPaymentRow, AdminBillingScholarship } from "@/components/dashboard/AdminStudentBillingEntry";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

interface AdminStudentBillingClientProps {
  locale: Locale;
  studentId: string;
  studentName: string;
  payments: AdminBillingPaymentRow[];
  scholarship: AdminBillingScholarship;
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
  scholarship,
  labels,
  enrollmentFeeExempt,
  enrollmentExemptReason,
  lastEnrollmentPaidAt,
}: AdminStudentBillingClientProps) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleExempt(period: { year: number; month: number }, exempt: boolean) {
    setBusy(true);
    setMsg(null);
    const res = await setPeriodExemption({
      locale,
      studentId,
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

      <AdminEnrollmentFeeExemption
        locale={locale}
        studentId={studentId}
        labels={labels}
        initialExempt={enrollmentFeeExempt}
        initialReason={enrollmentExemptReason}
        initialLastPaidAt={lastEnrollmentPaidAt}
      />

      <AdminStudentBillingScholarshipPanel
        locale={locale}
        studentId={studentId}
        scholarship={scholarship}
        labels={labels}
        busy={busy}
        setBusy={setBusy}
        setMsg={setMsg}
      />

      <AdminStudentBillingPeriodExemptionsPanel
        locale={locale}
        studentId={studentId}
        labels={labels}
        busy={busy}
        setBusy={setBusy}
        setMsg={setMsg}
      />

      <AdminStudentBillingPaymentsTable
        payments={payments}
        labels={labels}
        busy={busy}
        onToggleExempt={toggleExempt}
      />
    </div>
  );
}
