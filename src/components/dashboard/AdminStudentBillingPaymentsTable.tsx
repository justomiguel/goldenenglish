"use client";

import type { AdminBillingPaymentRow } from "@/components/dashboard/AdminStudentBillingEntry";
import type { Dictionary } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface AdminStudentBillingPaymentsTableProps {
  payments: AdminBillingPaymentRow[];
  labels: BillingLabels;
  busy: boolean;
  onToggleExempt: (period: { year: number; month: number }, exempt: boolean) => void;
}

export function AdminStudentBillingPaymentsTable({
  payments,
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
              <th className="px-3 py-2">{labels.colStatus}</th>
              <th className="px-3 py-2">{labels.colReceipt}</th>
              <th className="px-3 py-2">{labels.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2">
                  {r.month}/{r.year}
                </td>
                <td className="px-3 py-2">{r.amount != null ? String(r.amount) : "—"}</td>
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
                    "—"
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
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
