"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import {
  approveBillingReceipt,
  rejectBillingReceipt,
} from "@/app/[locale]/dashboard/admin/finance/receipts/actions";
import type { BillingInvoiceRow, BillingRejectionReasonCode } from "@/types/billing";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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
  const router = useRouter();
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
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div
        className="min-h-[15rem] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)] lg:min-h-[50vh]"
        data-tour={ADMIN_TOUR_ANCHORS.financeReceiptDetailPreview}
      >
        {isPdf ? (
          <iframe title={dict.openReview} src={signedUrl} className="h-[42vh] w-full lg:h-[70vh]" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL from our storage
          <img
            src={signedUrl}
            alt=""
            title={dict.tipReceiptImage}
            className="max-h-[42vh] w-full object-contain lg:max-h-[70vh]"
          />
        )}
      </div>
      <div
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]"
        data-tour={ADMIN_TOUR_ANCHORS.financeReceiptDetailActions}
      >
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
          title={dict.tipApproveReceipt}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-3.5 text-base font-bold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            setMsg(null);
            const r = await approveBillingReceipt({ receiptId, locale });
            setBusy(false);
            if (!r.ok) setMsg(r.message ?? dict.modalClose);
            else {
              router.push(`/${locale}/dashboard/admin/finance/receipts`);
              router.refresh();
            }
          }}
        >
          <Check className="h-5 w-5 shrink-0" aria-hidden />
          {dict.approveCta}
        </button>
        {!rejectOpen ? (
          <button
            type="button"
            disabled={busy}
            title={dict.tipRejectReceipt}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--color-error)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
            onClick={() => setRejectOpen(true)}
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.rejectCta}
          </button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-[var(--color-error)] p-3">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">{dict.rejectTitle}</p>
            <label className="block text-sm text-[var(--color-foreground)]">
              <span className="sr-only">{dict.rejectTitle}</span>
              <select
                className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-2 text-sm"
                value={code}
                title={dict.tipRejectReasonSelect}
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
                title={dict.tipRejectDetail}
                onChange={(e) => setDetail(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              title={dict.tipRejectSubmit}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-error)] px-4 py-2 text-sm font-semibold text-[var(--color-background)] disabled:opacity-50"
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
                else {
                  router.push(`/${locale}/dashboard/admin/finance/receipts`);
                  router.refresh();
                }
              }}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              {dict.rejectSubmit}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
