"use client";

import { SortableTh } from "@/components/molecules/SortableTh";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
} from "@/types/adminStudentBilling";
import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingPaymentsTableProps {
  locale?: string;
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  labels: BillingLabels;
  busy: boolean;
  /** When true, hides per-row exemption toggles (actions column shows an empty placeholder). */
  readOnly?: boolean;
  onToggleExempt?: (period: { year: number; month: number }, exempt: boolean) => void;
}

function formatPeriod(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function scholarshipDiscountForPeriod(
  scholarships: AdminBillingScholarship[],
  year: number,
  month: number,
): number | null {
  const percent = effectiveScholarshipPercentForPeriod(scholarships, year, month);
  return percent > 0 ? percent : null;
}

export function AdminStudentBillingPaymentsTable({
  locale = "es",
  payments,
  scholarships,
  labels,
  busy,
  readOnly = false,
  onToggleExempt,
}: AdminStudentBillingPaymentsTableProps) {
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    payments,
    {
      period: (r) => r.year * 100 + r.month,
      amount: (r) => r.amount,
      scholarship: (r) => scholarshipDiscountForPeriod(scholarships, r.year, r.month) ?? 0,
      status: (r) => r.status,
      receipt: (r) => r.receiptSignedUrl ?? "",
    },
    "period",
  );

  return (
    <section>
      <h2 className="font-semibold text-[var(--color-muted-foreground)]">{labels.paymentsTitle}</h2>
      <div className="mt-4 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <SortableTh columnId="period" label={labels.colPeriod} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="amount" label={labels.colAmount} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="scholarship" label={labels.colScholarship} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="status" label={labels.colStatus} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <SortableTh columnId="receipt" label={labels.colReceipt} sortKey={sortKey} sortDir={sortDir} onToggleSort={onToggleSort} sortLabels={sortLabels} className="px-3 py-2" />
              <th className="px-3 py-2">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => {
              const discountPercent = scholarshipDiscountForPeriod(
                scholarships,
                r.year,
                r.month,
              );
              const hasScholarshipDiscount = discountPercent != null;
              return (
              <tr
                key={r.id}
                className={[
                  "border-b border-[var(--color-border)] last:border-0",
                  hasScholarshipDiscount
                    ? "border-l-4 border-l-[var(--color-success)] bg-[var(--color-success)]/10"
                    : "",
                ].join(" ")}
              >
                <td className="px-3 py-2">
                  {formatPeriod(r.month, r.year)}
                </td>
                <td className="px-3 py-2">{r.amount != null ? String(r.amount) : labels.emptyValue}</td>
                <td className="px-3 py-2">
                  {hasScholarshipDiscount ? (
                    <span className="rounded-full border border-[var(--color-success)] bg-[var(--color-success)]/15 px-2 py-1 text-xs font-semibold text-[var(--color-success)]">
                      {labels.scholarshipDiscountPercent.replace(
                        "{percent}",
                        String(discountPercent),
                      )}
                    </span>
                  ) : (
                    labels.emptyValue
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{r.status}</td>
                <td className="px-3 py-2">
                  {r.receiptSignedUrl ? (
                    <a
                      href={r.receiptSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-primary)] underline"
                    >
                      {labels.viewReceipt}
                    </a>
                  ) : (
                    labels.emptyValue
                  )}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    labels.emptyValue
                  ) : r.status !== "approved" ? (
                    <button
                      type="button"
                      className="text-sm text-[var(--color-primary)] underline"
                      disabled={busy}
                      onClick={() =>
                        onToggleExempt?.({ year: r.year, month: r.month }, r.status !== "exempt")
                      }
                    >
                      {r.status === "exempt" ? labels.unexemptPeriod : labels.exemptPeriod}
                    </button>
                  ) : (
                    labels.emptyValue
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
