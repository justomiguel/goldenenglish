"use client";

import type { Dictionary } from "@/types/i18n";

export type StudentPaymentRow = {
  id: string;
  month: number;
  year: number;
  amount: number | null;
  status: "pending" | "approved" | "rejected";
  updated_at: string;
  receiptSignedUrl: string | null;
};

interface StudentPaymentsHistoryProps {
  rows: StudentPaymentRow[];
  labels: Dictionary["dashboard"]["student"];
}

function statusLabel(
  s: StudentPaymentRow["status"],
  labels: Dictionary["dashboard"]["student"],
): string {
  if (s === "approved") return labels.statusApproved;
  if (s === "rejected") return labels.statusRejected;
  return labels.statusPending;
}

export function StudentPaymentsHistory({ rows, labels }: StudentPaymentsHistoryProps) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-10 overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
          <tr>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">
              {labels.paymentMonth}
            </th>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">
              {labels.paymentYear}
            </th>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">
              {labels.paymentAmount}
            </th>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">
              {labels.paymentStatus}
            </th>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]">
              {labels.paymentSubmitted}
            </th>
            <th className="px-4 py-3 font-semibold text-[var(--color-foreground)]" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="px-4 py-3">{r.month}</td>
              <td className="px-4 py-3">{r.year}</td>
              <td className="px-4 py-3">{r.amount != null ? String(r.amount) : "—"}</td>
              <td className="px-4 py-3">{statusLabel(r.status, labels)}</td>
              <td className="px-4 py-3 text-[var(--color-muted-foreground)]">
                {new Date(r.updated_at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                {r.receiptSignedUrl ? (
                  <a
                    href={r.receiptSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
                  >
                    {labels.paymentViewReceipt}
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
