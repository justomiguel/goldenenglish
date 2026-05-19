"use client";

import { useRef, useState } from "react";
import { uploadBillingReceipt } from "@/app/[locale]/dashboard/billing/actions";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { BillingInvoiceRow } from "@/types/billing";

export interface BillingUploadReceiptFormProps {
  locale: string;
  invoice: BillingInvoiceRow;
  dict: Dictionary["dashboard"]["portalBilling"];
  fileUploadProgress: FileUploadProgressLabels;
  onDone: () => void;
}

export function BillingUploadReceiptForm({
  locale,
  invoice,
  dict,
  fileUploadProgress,
  onDone,
}: BillingUploadReceiptFormProps) {
  const amountRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitReceipt(selected: File) {
    setMessage(null);
    setBusy(true);
    setFile(selected);

    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("invoiceId", invoice.id);
    fd.set("receipt", selected);
    const amountValue = amountRef.current?.value ?? String(invoice.amount);
    fd.set("amount", amountValue);

    try {
      const res = await uploadBillingReceipt(fd);
      if (!res.ok) {
        setMessage(res.message ?? dict.modalClose);
        return;
      }
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="invoiceId" value={invoice.id} />
      <label className="block text-sm font-medium text-[var(--color-foreground)]">
        {dict.modalAmountLabel}
        <input
          ref={amountRef}
          name="amount"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={invoice.amount}
          disabled={busy}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </label>
      <ReceiptAutoUploadField
        buttonLabel={dict.modalSubmit}
        inputAriaLabel={dict.modalDrop}
        accept="image/png,image/jpeg,image/webp,application/pdf"
        disabled={busy}
        busy={busy}
        selectedFileName={file?.name ?? null}
        noFileSelectedLabel={dict.modalDrop}
        fileUploadProgress={fileUploadProgress}
        onFileSelected={submitReceipt}
      />
      {message ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}
    </form>
  );
}
