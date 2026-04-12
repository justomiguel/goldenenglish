"use client";

import { useState } from "react";
import { reviewPayment } from "@/app/[locale]/dashboard/admin/payments/actions";
import type { Dictionary } from "@/types/i18n";

interface PaymentReviewRowProps {
  locale: string;
  paymentId: string;
  studentLabel: string;
  periodLabel: string;
  amountLabel: string;
  previewUrl: string | null;
  labels: Dictionary["admin"]["payments"];
  emptyValue: string;
}

export function PaymentReviewRow({
  locale,
  paymentId,
  studentLabel,
  periodLabel,
  amountLabel,
  previewUrl,
  labels,
  emptyValue,
}: PaymentReviewRowProps) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(status: "approved" | "rejected") {
    setBusy(true);
    await reviewPayment({
      paymentId,
      status,
      adminNotes: notes || undefined,
      locale,
    });
    setBusy(false);
    window.location.reload();
  }

  return (
    <li className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-[var(--color-foreground)]">{studentLabel}</p>
          <p className="text-[var(--color-muted-foreground)]">
            {labels.period}: {periodLabel} · {labels.amount}: {amountLabel}
          </p>
          <label className="mt-3 block text-xs font-medium text-[var(--color-muted-foreground)]">
            {labels.notes}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-2 py-1 text-sm text-[var(--color-foreground)]"
            />
          </label>
        </div>
        <div className="flex shrink-0 flex-col gap-2 md:w-56">
          {previewUrl && /\.pdf($|\?)/i.test(previewUrl) ? null : previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="max-h-36 w-full rounded-[var(--layout-border-radius)] object-contain ring-1 ring-[var(--color-border)]"
            />
          ) : null}
          {previewUrl ? (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[var(--color-primary)] underline"
            >
              {labels.receipt}
            </a>
          ) : (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {labels.receipt}: {emptyValue}
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => act("approved")}
            className="rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
          >
            {labels.approve}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act("rejected")}
            className="rounded-[var(--layout-border-radius)] border-2 border-[var(--color-secondary)] px-3 py-2 text-sm font-medium text-[var(--color-secondary)]"
          >
            {labels.reject}
          </button>
        </div>
      </div>
    </li>
  );
}
