"use client";

import { type FormEvent, useState } from "react";
import { submitStudentPaymentReceipt } from "@/app/[locale]/dashboard/student/payments/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

type StudentPayLabels = Dictionary["dashboard"]["student"];

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface StudentPaymentFormProps {
  labels: StudentPayLabels;
}

export function StudentPaymentForm({ labels }: StudentPaymentFormProps) {
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2026);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      <div>
        <Label htmlFor="sp-file">{labels.payReceipt}</Label>
        <input
          id="sp-file"
          name="receipt"
          type="file"
          accept="image/*,application/pdf"
          required
          className="mt-1 block w-full min-h-[44px] text-sm"
        />
      </div>
      <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px] w-full sm:w-auto">
        {labels.paySubmit}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
