"use client";

import { type ReactNode, useState } from "react";
import { Save, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

export interface SectionFeePlanFormValues {
  effectiveFromYear: number;
  effectiveFromMonth: number;
  monthlyFee: number;
  /** ISO 4217 (3 letras mayúsculas), validado en cliente y servidor. */
  currency: string;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export interface AcademicSectionFeePlanFormProps {
  initialValues: SectionFeePlanFormValues;
  /** System-wide billing currency (read-only, configured in Finance > Settings). */
  systemCurrency: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["feePlans"];
  submitLabel: string;
  onSubmit: (v: SectionFeePlanFormValues) => Promise<void> | void;
  onCancel?: () => void;
  busy?: boolean;
  errorMessage?: string | null;
  footerExtra?: ReactNode;
  idPrefix: string;
}

export function AcademicSectionFeePlanForm({
  initialValues,
  systemCurrency,
  dict,
  submitLabel,
  onSubmit,
  onCancel,
  busy = false,
  errorMessage,
  footerExtra,
  idPrefix,
}: AcademicSectionFeePlanFormProps) {
  const [effectiveFromMonth, setEffectiveFromMonth] = useState(initialValues.effectiveFromMonth);
  const [effectiveFromYearRaw, setEffectiveFromYearRaw] = useState(
    String(initialValues.effectiveFromYear),
  );
  const [monthlyFeeRaw, setMonthlyFeeRaw] = useState(String(initialValues.monthlyFee));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        const effectiveFromYear = Number(effectiveFromYearRaw);
        const monthlyFee = Number(monthlyFeeRaw);
        if (!Number.isFinite(effectiveFromYear) || !Number.isFinite(monthlyFee)) return;
        void onSubmit({
          effectiveFromMonth,
          effectiveFromYear,
          monthlyFee,
          currency: systemCurrency,
        });
      }}
      className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}-eff-month`}>{dict.effectiveFromMonth}</Label>
          <select
            id={`${idPrefix}-eff-month`}
            value={effectiveFromMonth}
            onChange={(e) => setEffectiveFromMonth(Number(e.target.value))}
            className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            disabled={busy}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-eff-year`}>{dict.effectiveFromYear}</Label>
          <Input
            id={`${idPrefix}-eff-year`}
            type="number"
            min={2000}
            max={2100}
            value={effectiveFromYearRaw}
            onChange={(e) => setEffectiveFromYearRaw(e.target.value)}
            disabled={busy}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-monthly-fee`}>{dict.monthlyFee}</Label>
          <Input
            id={`${idPrefix}-monthly-fee`}
            type="number"
            min={0}
            step="0.01"
            value={monthlyFeeRaw}
            onChange={(e) => setMonthlyFeeRaw(e.target.value)}
            disabled={busy}
            required
          />
        </div>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.prorateExplanation}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          disabled={busy}
          isLoading={busy}
          className="min-h-[44px]"
        >
          {!busy ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
            className="min-h-[44px]"
          >
            {!busy ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.cancel}
          </Button>
        ) : null}
        {footerExtra}
      </div>
      {errorMessage ? (
        <p className="text-sm text-[var(--color-error)]" role="status">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
