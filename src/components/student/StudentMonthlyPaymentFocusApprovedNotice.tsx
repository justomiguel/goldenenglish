"use client";

import { Download as DownloadIcon } from "lucide-react";
import { StudentPaidWithMethodLine } from "@/components/student/StudentPaidWithMethodLine";
import type { Dictionary, Locale } from "@/types/i18n";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

export interface StudentMonthlyPaymentFocusApprovedNoticeProps {
  locale: Locale;
  paymentId: string | null | undefined;
  paymentMethod?: string | null;
  paidOn?: string | null;
  labels: MonthlyLabels;
}

export function StudentMonthlyPaymentFocusApprovedNotice({
  locale,
  paymentId,
  paymentMethod,
  paidOn,
  labels,
}: StudentMonthlyPaymentFocusApprovedNoticeProps) {
  return (
    <div className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 px-3 py-2 text-sm text-[var(--color-success)]">
      <p>{labels.alreadyApproved}</p>
      <StudentPaidWithMethodLine method={paymentMethod} paidOn={paidOn} locale={locale} labels={labels} />
      {paymentId ? (
        <a
          href={`/api/payments/${paymentId}/receipt.pdf?locale=${encodeURIComponent(locale)}`}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          <DownloadIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {labels.receipt.downloadPdf}
        </a>
      ) : null}
    </div>
  );
}
