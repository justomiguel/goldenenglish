"use client";

import { useState } from "react";
import {
  approveBillingReceipt,
  rejectBillingReceipt,
} from "@/app/[locale]/dashboard/admin/finance/receipts/actions";
import type { BillingInvoiceRow, BillingRejectionReasonCode } from "@/types/billing";
import type { Dictionary } from "@/types/i18n";

export interface AdminFinanceReceiptReviewClientProps {
  locale: string;
  receiptId: string;
  signedUrl: string;
  isPdf: boolean;
  studentName: string;
  invoice: BillingInvoiceRow;
  amountPaid: number;
  dict: Dictionary["dashboard"]["portalBilling"];
}

const REASONS: BillingRejectionReasonCode[] = [
  "image_blurry",
  "amount_mismatch",
  "wrong_account",
  "other",
];

export function AdminFinanceReceiptReviewClient({
  locale,
  receiptId,
  signedUrl,
  isPdf,
  studentName,
  invoice,
  amountPaid,
  dict,
}: AdminFinanceReceiptReviewClientProps) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [code, setCode] = useState<BillingRejectionReasonCode>("image_blurry");
  const [detail, setDetail] = useState("");

  const reasonLabel = (c: BillingRejectionReasonCode) => {
    switch (c) {
      case "image_blurry":
        return dict.rejectReasonImageBlurry;
      case "amount_mismatch":
        return dict.rejectReasonAmountMismatch;
      case "wrong_account":
        return dict.rejectReasonWrongAccount;
      default:
        return dict.rejectReasonOther;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-h-[50vh] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        {isPdf ? (
          <iframe title={dict.openReview} src={signedUrl} className="h-[70vh] w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from our storage
          <img src={signedUrl} alt="" className="max-h-[70vh] w-full object-contain" />
        )}
      </div>
      <div className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
            {dict.adminColStudent}
          </p>
          <p className="text-lg font-semibold text-[var(--color-foreground)]">{studentName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--color-muted-foreground)]">
            {dict.adminColInvoice}
          </p>
          <p className="text-[var(--color-foreground)]">{invoice.description}</p>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--color-muted-foreground)]">{dict.expectedAmount}</dt>
            <dd className="font-medium text-[var(--color-foreground)]">{invoice.amount}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[var(--color-muted-foreground)]">{dict.receiptAmount}</dt>
            <dd className="font-medium text-[var(--color-foreground)]">{amountPaid}</dd>
          </div>
        </dl>
        {msg ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {msg}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-4 text-base font-bold text-[var(--color-primary-foreground)] disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await approveBillingReceipt({ receiptId, locale });
            setBusy(false);
            if (!r.ok) setMsg(r.message ?? dict.modalClose);
            else window.location.href = `/${locale}/dashboard/admin/finance/receipts`;
          }}
        >
          {dict.approveCta}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            disabled={busy}
            className="w-full rounded-[var(--layout-border-radius)] border-2 border-[var(--color-error)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-error)] disabled:opacity-50"
            onClick={() => setRejectOpen(true)}
          >
            {dict.rejectCta}
          </button>
        ) : (
          <div className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-surface)] p-3">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{dict.rejectTitle}</p>
            <label className="block text-sm text-[var(--color-foreground)]">
              <span className="sr-only">{dict.rejectTitle}</span>
              <select
                className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-2 text-sm"
                value={code}
                onChange={(e) => setCode(e.target.value as BillingRejectionReasonCode)}
              >
                {REASONS.map((c) => (
                  <option key={c} value={c}>
                    {reasonLabel(c)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-[var(--color-foreground)]">
              {dict.rejectDetailLabel}
              <textarea
                className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-2 text-sm"
                rows={3}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              className="w-full rounded-[var(--layout-border-radius)] bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-[var(--color-background)] disabled:opacity-50"
              onClick={async () => {
                setBusy(true);
                setMsg(null);
                const r = await rejectBillingReceipt({
                  receiptId,
                  locale,
                  code,
                  detail: detail.trim() || undefined,
                });
                setBusy(false);
                if (!r.ok) setMsg(r.message ?? dict.modalClose);
                else window.location.href = `/${locale}/dashboard/admin/finance/receipts`;
              }}
            >
              {dict.rejectSubmit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
