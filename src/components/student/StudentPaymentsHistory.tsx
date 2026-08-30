"use client";

import { Download } from "lucide-react";
import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type { Dictionary, Locale } from "@/types/i18n";

export type StudentPaymentRow = {
  id: string;
  month: number;
  year: number;
  amount: number | null;
  /** Amount after scholarship discount when applicable */
  displayAmount: number | null;
  status: "pending" | "approved" | "rejected" | "exempt";
  updated_at: string;
  receiptSignedUrl: string | null;
};

interface StudentPaymentsHistoryProps {
  rows: StudentPaymentRow[];
  labels: Dictionary["dashboard"]["student"];
  /** Locale used to build the receipt PDF download URL. */
  locale: Locale;
}

function statusLabel(
  s: StudentPaymentRow["status"],
  labels: Dictionary["dashboard"]["student"],
): string {
  if (s === "approved") return labels.statusApproved;
  if (s === "rejected") return labels.statusRejected;
  if (s === "exempt") return labels.statusExempt;
  return labels.statusPending;
}

export function StudentPaymentsHistory({ rows, labels, locale }: StudentPaymentsHistoryProps) {
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    rows,
    {
      month: (r) => r.month,
      year: (r) => r.year,
      amount: (r) => r.displayAmount,
      status: (r) => r.status,
      submitted: (r) => r.updated_at,
    },
    "year",
  );

  if (rows.length === 0) return null;
  const receiptDownloadLabel = labels.monthly.receipt.downloadPdf;

  return (
    <div className="mt-10 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
          <tr>
            <SortableTh columnId="month" label={labels.paymentMonth} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
            <SortableTh columnId="year" label={labels.paymentYear} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
            <SortableTh columnId="amount" label={labels.paymentAmount} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
            <SortableTh columnId="status" label={labels.paymentStatus} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
            <SortableTh columnId="submitted" label={labels.paymentSubmitted} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((r) => {
            const showScholarship =
              r.status === "pending" &&
              r.amount != null &&
              r.displayAmount != null &&
              Math.abs(r.displayAmount - r.amount) > 0.009;
            return (
              <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3">{r.month}</td>
                <td className="px-4 py-3">{r.year}</td>
                <td className="px-4 py-3">
                  {r.displayAmount != null ? (
                    <span>
                      {String(r.displayAmount)}
                      {showScholarship ? (
                        <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                          ({labels.scholarshipAdjusted}: {String(r.amount)})
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    labels.emptyValue
                  )}
                </td>
                <td className="px-4 py-3">{statusLabel(r.status, labels)}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                  {new Date(r.updated_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1.5">
                    {r.receiptSignedUrl ? (
                      <a
                        href={r.receiptSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                      >
                        {labels.paymentViewReceipt}
                      </a>
                    ) : null}
                    {r.status === "approved" ? (
                      <a
                        href={`/api/payments/${r.id}/receipt.pdf?locale=${encodeURIComponent(locale)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {receiptDownloadLabel}
                      </a>
                    ) : null}
                    {!r.receiptSignedUrl && r.status !== "approved" ? labels.emptyValue : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
