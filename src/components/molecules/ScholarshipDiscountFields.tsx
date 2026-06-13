"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import {
  deriveScholarshipDiscountPercent,
  type ScholarshipDiscountInputMode,
} from "@/lib/billing/deriveScholarshipDiscountPercent";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface ScholarshipDiscountFieldsProps {
  idPrefix: string;
  locale: Locale;
  currency: string | null;
  referenceMonthlyAmount: number | null;
  labels: BillingLabels;
  disabled?: boolean;
  minPercent?: number;
  defaultPercent?: string;
  onResolvedPercentChange: (percent: number | null) => void;
}

export function ScholarshipDiscountFields({
  idPrefix,
  locale,
  currency,
  referenceMonthlyAmount,
  labels,
  disabled = false,
  minPercent = 1,
  defaultPercent = "",
  onResolvedPercentChange,
}: ScholarshipDiscountFieldsProps) {
  const modeId = useId();
  const [mode, setMode] = useState<ScholarshipDiscountInputMode>("percent");
  const [percent, setPercent] = useState(defaultPercent);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [annualAmount, setAnnualAmount] = useState("");
  const [prevDefaultPercent, setPrevDefaultPercent] = useState(defaultPercent);

  if (prevDefaultPercent !== defaultPercent) {
    setPrevDefaultPercent(defaultPercent);
    setMode("percent");
    setPercent(defaultPercent);
    setMonthlyAmount("");
    setAnnualAmount("");
  }

  const resolved = useMemo(
    () =>
      deriveScholarshipDiscountPercent({
        referenceMonthlyAmount,
        mode,
        percentRaw: percent,
        monthlyAmountRaw: monthlyAmount,
        annualAmountRaw: annualAmount,
        minPercent,
      }),
    [referenceMonthlyAmount, mode, percent, monthlyAmount, annualAmount, minPercent],
  );

  useEffect(() => {
    onResolvedPercentChange(resolved.ok ? resolved.discountPercent : null);
  }, [resolved, onResolvedPercentChange]);

  const moneyCurrency = currency ?? "USD";
  const referenceMonthlyLabel =
    referenceMonthlyAmount != null && referenceMonthlyAmount > 0
      ? labels.scholarshipReferenceMonthly.replace(
          "{amount}",
          formatMoneyLabel(referenceMonthlyAmount, moneyCurrency, locale),
        )
      : labels.scholarshipReferenceMissing;

  const referenceAnnualLabel =
    referenceMonthlyAmount != null && referenceMonthlyAmount > 0
      ? labels.scholarshipReferenceAnnual.replace(
          "{amount}",
          formatMoneyLabel(referenceMonthlyAmount * 12, moneyCurrency, locale),
        )
      : labels.scholarshipReferenceMissing;

  const errorMessage =
    !resolved.ok && resolved.code === "target_above_reference"
      ? labels.scholarshipAmountAboveReference
      : !resolved.ok && (resolved.code === "invalid_target" || resolved.code === "missing_reference")
        ? labels.scholarshipAmountInvalid
        : !resolved.ok && resolved.code === "invalid_percent"
          ? labels.scholarshipInvalidPercent
          : null;

  const derivedHint =
    resolved.ok && mode !== "percent"
      ? labels.scholarshipDerivedPercent.replace("{percent}", String(resolved.discountPercent))
      : null;

  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-[var(--color-foreground)]">
          {labels.scholarshipInputModeLegend}
        </legend>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-3">
          {(
            [
              { value: "percent", label: labels.scholarshipInputModePercent },
              { value: "monthly_amount", label: labels.scholarshipInputModeMonthly },
              { value: "annual_amount", label: labels.scholarshipInputModeAnnual },
            ] as const
          ).map((opt) => (
            <label key={opt.value} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={modeId}
                value={opt.value}
                checked={mode === opt.value}
                disabled={disabled}
                onChange={() => setMode(opt.value)}
                className="accent-[var(--color-primary)]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === "percent" ? (
        <div>
          <Label htmlFor={`${idPrefix}-pct`}>{labels.scholarshipPercent}</Label>
          <Input
            id={`${idPrefix}-pct`}
            type="number"
            min={minPercent}
            max={100}
            step={0.5}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            required
            disabled={disabled}
            className="mt-1"
          />
        </div>
      ) : null}

      {mode === "monthly_amount" ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-monthly`}>{labels.scholarshipTargetMonthly}</Label>
          <p className="text-xs text-[var(--color-muted-foreground)]">{referenceMonthlyLabel}</p>
          <Input
            id={`${idPrefix}-monthly`}
            type="number"
            min={0}
            step={0.01}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            disabled={disabled}
            className="mt-1"
            aria-invalid={errorMessage ? true : undefined}
          />
        </div>
      ) : null}

      {mode === "annual_amount" ? (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-annual`}>{labels.scholarshipTargetAnnual}</Label>
          <p className="text-xs text-[var(--color-muted-foreground)]">{referenceAnnualLabel}</p>
          <Input
            id={`${idPrefix}-annual`}
            type="number"
            min={0}
            step={0.01}
            value={annualAmount}
            onChange={(e) => setAnnualAmount(e.target.value)}
            disabled={disabled}
            className="mt-1"
            aria-invalid={errorMessage ? true : undefined}
          />
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-xs text-[var(--color-error)]" role="alert">{errorMessage}</p>
      ) : null}
      {derivedHint ? (
        <p className="text-xs font-medium text-[var(--color-foreground)]" role="status">{derivedHint}</p>
      ) : null}
    </div>
  );
}
