"use client";

import { CreditCard } from "lucide-react";
import { type FormEvent, useState } from "react";
import { submitStudentPaymentReceipt } from "@/app/[locale]/dashboard/student/payments/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary, Locale } from "@/types/i18n";

type StudentPayLabels = Dictionary["dashboard"]["student"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface StudentPaymentFormProps {
  locale: Locale;
  labels: StudentPayLabels;
}

export function StudentPaymentForm({ locale, labels }: StudentPaymentFormProps) {
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2026);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await submitStudentPaymentReceipt(fd);
    setBusy(false);
    setMsg(res.ok ? labels.paySuccess : `${labels.payError}: ${res.message ?? ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
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
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            id="sp-file"
            name="receipt"
            type="file"
            accept="image/*,application/pdf"
            required
            aria-label={labels.payReceipt}
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setReceiptFileName(f?.name ?? null);
            }}
          />
          <label
            htmlFor="sp-file"
            className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-[var(--layout-border-radius)] border-2 border-[var(--color-primary)] bg-[var(--color-background)] px-4 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-muted)] focus-within:outline-none focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:ring-offset-2 sm:w-auto"
          >
            {labels.payReceiptChooseButton}
          </label>
          <p
            className="text-sm text-[var(--color-muted-foreground)] sm:min-h-[44px] sm:flex sm:max-w-[min(100%,20rem)] sm:items-center"
            aria-live="polite"
          >
            <span className="break-all font-medium text-[var(--color-foreground)]">
              {receiptFileName ?? labels.payReceiptNoFileSelected}
            </span>
          </p>
        </div>
      </fieldset>
      <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px] w-full sm:w-auto">
        {!busy ? <CreditCard className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.paySubmit}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
