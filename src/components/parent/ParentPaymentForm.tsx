"use client";

import { type FormEvent, useState } from "react";
import { submitParentPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { PromotionApplyForm } from "@/components/molecules/PromotionApplyForm";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { Locale } from "@/types/i18n";

interface ParentPaymentFormProps {
  locale: Locale;
  options: { id: string; label: string }[];
  labels: Dictionary["dashboard"]["parent"];
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function ParentPaymentForm({ locale, options, labels }: ParentPaymentFormProps) {
  const [studentId, setStudentId] = useState(options[0]?.id ?? "");
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
    const res = await submitParentPaymentReceipt(fd);
    setBusy(false);
    setMsg(res.ok ? labels.success : `${labels.error}: ${res.message ?? ""}`);
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 max-w-lg space-y-6">
      <div>
        <Label htmlFor="pp-child">{labels.child}</Label>
        <select
          id="pp-child"
          form="pp-receipt-form"
          name="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <PromotionApplyForm
        locale={locale}
        studentId={studentId}
        labels={{
          promoTitle: labels.promoTitle,
          promoLead: labels.promoLead,
          promoPlaceholder: labels.promoPlaceholder,
          promoApply: labels.promoApply,
          promoSuccess: labels.promoSuccess,
          promoError: labels.promoError,
        }}
      />
      <form
        id="pp-receipt-form"
        onSubmit={onSubmit}
        className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
      >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="pp-month">{labels.month}</Label>
          <select
            id="pp-month"
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
          <Label htmlFor="pp-year">{labels.year}</Label>
          <Input
            id="pp-year"
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
        <Label htmlFor="pp-amount">{labels.amount}</Label>
        <Input
          id="pp-amount"
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
        <Label htmlFor="pp-file">{labels.receipt}</Label>
        <input
          id="pp-file"
          name="receipt"
          type="file"
          accept="image/*,application/pdf"
          required
          className="mt-1 block w-full text-sm"
        />
      </div>
      <Button type="submit" disabled={busy} isLoading={busy}>
        {labels.submit}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
    </div>
  );
}
