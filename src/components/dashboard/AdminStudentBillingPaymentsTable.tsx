"use client";

import type {
  AdminBillingPaymentRow,
  AdminBillingScholarship,
} from "@/types/adminStudentBilling";
import { effectiveScholarshipPercentForPeriod } from "@/lib/billing/scholarshipPeriod";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingPaymentsTableProps {
  payments: AdminBillingPaymentRow[];
  scholarships: AdminBillingScholarship[];
  labels: BillingLabels;
  busy: boolean;
  onToggleExempt: (period: { year: number; month: number }, exempt: boolean) => void;
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
  payments,
  scholarships,
  labels,
  busy,
  onToggleExempt,
}: AdminStudentBillingPaymentsTableProps) {
  return (
    <section>
      <h2 className="font-semibold text-[var(--color-secondary)]">{labels.paymentsTitle}</h2>
      <div className="mt-4 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <th className="px-3 py-2">{labels.colPeriod}</th>
              <th className="px-3 py-2">{labels.colAmount}</th>
              <th className="px-3 py-2">{labels.colScholarship}</th>
              <th className="px-3 py-2">{labels.colStatus}</th>
              <th className="px-3 py-2">{labels.colReceipt}</th>
              <th className="px-3 py-2">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((r) => {
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
                  {r.status !== "approved" ? (
                    <button
                      type="button"
                      className="text-sm text-[var(--color-primary)] underline"
                      disabled={busy}
                      onClick={() =>
                        onToggleExempt({ year: r.year, month: r.month }, r.status !== "exempt")
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
