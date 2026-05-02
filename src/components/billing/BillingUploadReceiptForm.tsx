"use client";

import { useFormStatus } from "react-dom";
import { useRef, useState } from "react";
import { uploadBillingReceipt } from "@/app/[locale]/dashboard/billing/actions";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { BillingInvoiceRow } from "@/types/billing";

function SubmitRow({
  dict,
  fileUploadProgress,
  disabled,
}: {
  dict: Dictionary["dashboard"]["portalBilling"];
  fileUploadProgress: FileUploadProgressLabels;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <div className="space-y-2">
      {pending ? (
        <InlineUploadProgressBar
          label={fileUploadProgress.progressSending}
          indeterminate
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
        />
      ) : null}
      <button
        type="submit"
        disabled={disabled || pending}
        className="w-full rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-50"
      >
        {pending ? dict.uploading : dict.modalSubmit}
      </button>
    </div>
  );
}

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
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={async (fd) => {
        setMessage(null);
        const res = await uploadBillingReceipt(fd);
        if (!res.ok) {
          setMessage(res.message ?? dict.modalClose);
          return;
        }
        onDone();
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="invoiceId" value={invoice.id} />
      <div
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-6 text-center text-sm text-[var(--color-muted-foreground)]"
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          const input = inputRef.current;
          if (f && input) {
            const dt = new DataTransfer();
            dt.items.add(f);
            input.files = dt.files;
            setFile(f);
          }
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={dict.modalDrop}
      >
        <input
          ref={inputRef}
          type="file"
          name="receipt"
          required
          className="sr-only"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
          }}
        />
        {file ? (
          <span className="text-[var(--color-foreground)]">{file.name}</span>
        ) : (
          <span>{dict.modalDrop}</span>
        )}
      </div>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">
        {dict.modalAmountLabel}
        <input
          name="amount"
          type="number"
          min={0}
          step="0.01"
          required
          defaultValue={invoice.amount}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </label>
      {message ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {message}
        </p>
      ) : null}
      <SubmitRow dict={dict} fileUploadProgress={fileUploadProgress} disabled={!file} />
    </form>
  );
}
