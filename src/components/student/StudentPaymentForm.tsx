"use client";

import { useState } from "react";
import { submitStudentPaymentReceipt } from "@/app/[locale]/dashboard/student/payments/actions";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import type { Dictionary, Locale } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

type StudentPayLabels = Dictionary["dashboard"]["student"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface StudentPaymentFormProps {
  locale: Locale;
  labels: StudentPayLabels;
  fileUploadProgress: FileUploadProgressLabels;
}

export function StudentPaymentForm({ locale, labels, fileUploadProgress }: StudentPaymentFormProps) {
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2026);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  async function submitReceipt(file: File) {
    if (!amount.trim()) {
      setMsg(`${labels.payError}: ${labels.payAmount}`);
      return;
    }
    setBusy(true);
    setMsg(null);
    setReceiptFileName(file.name);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("month", String(month));
    fd.set("year", String(year));
    fd.set("amount", amount);
    fd.set("receipt", file);
    const res = await submitStudentPaymentReceipt(fd);
    setBusy(false);
    setMsg(res.ok ? labels.paySuccess : `${labels.payError}: ${res.message ?? ""}`);
  }

  return (
    <form
      className="mt-6 max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      <input type="hidden" name="locale" value={locale} readOnly />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="sp-month">{labels.payMonth}</Label>
          <select
            id="sp-month"
            name="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="sp-year">{labels.payYear}</Label>
          <Input
            id="sp-year"
            name="year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="mt-1 w-full"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="sp-amount">{labels.payAmount}</Label>
        <Input
          id="sp-amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full"
          required
        />
      </div>
      <fieldset className="min-w-0 border-0 p-0">
        <legend className="text-sm font-semibold text-[var(--color-foreground)]">
          {labels.payReceipt}
        </legend>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.payReceiptHint}</p>
        <div className="mt-3">
          <ReceiptAutoUploadField
            buttonLabel={labels.paySubmit}
            inputAriaLabel={labels.payReceipt}
            disabled={busy}
            busy={busy}
            selectedFileName={receiptFileName}
            noFileSelectedLabel={labels.payReceiptNoFileSelected}
            fileUploadProgress={fileUploadProgress}
            onFileSelected={submitReceipt}
          />
        </div>
      </fieldset>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
