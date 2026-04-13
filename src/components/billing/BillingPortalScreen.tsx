"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/atoms/Modal";
import { BillingUploadReceiptForm } from "@/components/billing/BillingUploadReceiptForm";
import type { Dictionary } from "@/types/i18n";
import type { BillingInvoiceRow, BillingInvoiceStatus } from "@/types/billing";

export interface BillingPortalScreenProps {
  locale: string;
  viewer: "parent" | "student";
  isMinorStudent: boolean;
  dict: Dictionary["dashboard"]["portalBilling"];
  invoices: BillingInvoiceRow[];
}

function formatMoney(locale: string, n: number) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(locale: string, iso: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

function statusLabel(
  s: BillingInvoiceStatus,
  dict: Dictionary["dashboard"]["portalBilling"],
): string {
  switch (s) {
    case "pending":
      return dict.statusPending;
    case "verifying":
      return dict.statusVerifying;
    case "paid":
      return dict.statusPaid;
    case "overdue":
      return dict.statusOverdue;
    case "voided":
      return dict.statusVoided;
    default:
      return dict.none;
  }
}

export function BillingPortalScreen({
  locale,
  viewer,
  isMinorStudent,
  dict,
  invoices,
}: BillingPortalScreenProps) {
  const [active, setActive] = useState<BillingInvoiceRow | null>(null);

  const summary = useMemo(() => {
    const open = invoices.filter((i) =>
      ["pending", "verifying", "overdue"].includes(i.status),
    );
    const balance = open.reduce((a, i) => a + Number(i.amount), 0);
    const next =
      open.length === 0
        ? null
        : open
            .map((i) => i.due_date)
            .sort()
            .at(0) ?? null;
    return { balance, next };
  }, [invoices]);

  if (viewer === "student" && isMinorStudent) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.studentMinorLead}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.balancePending}
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">
            {formatMoney(locale, summary.balance)}
          </p>
        </div>
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            {dict.nextDue}
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-foreground)]">
            {summary.next ? formatDate(locale, summary.next) : dict.none}
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[var(--color-muted)] text-[var(--color-foreground)]">
              <tr>
                <th className="px-3 py-2 font-semibold">{dict.colDescription}</th>
                <th className="px-3 py-2 font-semibold">{dict.colDue}</th>
                <th className="px-3 py-2 font-semibold">{dict.colAmount}</th>
                <th className="px-3 py-2 font-semibold">{dict.colStatus}</th>
                <th className="px-3 py-2 font-semibold" aria-label={dict.informPay}>
                  <span className="sr-only">{dict.informPay}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t border-[var(--color-border)] text-[var(--color-foreground)]"
                >
                  <td className="px-3 py-2">{inv.description}</td>
                  <td className="px-3 py-2">{formatDate(locale, inv.due_date)}</td>
                  <td className="px-3 py-2">{formatMoney(locale, Number(inv.amount))}</td>
                  <td className="px-3 py-2">{statusLabel(inv.status, dict)}</td>
                  <td className="px-3 py-2">
                    {inv.status === "pending" || inv.status === "overdue" ? (
                      <button
                        type="button"
                        className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-primary-foreground)]"
                        onClick={() => setActive(inv)}
                      >
                        {dict.informPay}
                      </button>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={active !== null}
        onOpenChange={(o) => {
          if (!o) setActive(null);
        }}
        titleId="billing-upload-title"
        title={dict.modalTitle}
        dialogClassName="max-w-lg"
      >
        {active ? (
          <BillingUploadReceiptForm
            locale={locale}
            invoice={active}
            dict={dict}
            onDone={() => {
              setActive(null);
              window.location.reload();
            }}
          />
        ) : null}
      </Modal>
    </div>
  );
}
