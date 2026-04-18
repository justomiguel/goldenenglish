"use client";

import { type ReactNode, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

export interface SectionFeePlanFormValues {
  effectiveFromYear: number;
  effectiveFromMonth: number;
  monthlyFee: number;
  paymentsCount: number;
  chargesEnrollmentFee: boolean;
  periodStartYear: number;
  periodStartMonth: number;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export interface AcademicSectionFeePlanFormProps {
  initialValues: SectionFeePlanFormValues;
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
  dict,
  submitLabel,
  onSubmit,
  onCancel,
  busy = false,
  errorMessage,
  footerExtra,
  idPrefix,
}: AcademicSectionFeePlanFormProps) {
  const [values, setValues] = useState<SectionFeePlanFormValues>(initialValues);

  const update = <K extends keyof SectionFeePlanFormValues>(
    key: K,
    value: SectionFeePlanFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        void onSubmit(values);
      }}
      className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${idPrefix}-eff-month`}>{dict.effectiveFromMonth}</Label>
          <select
            id={`${idPrefix}-eff-month`}
            value={values.effectiveFromMonth}
            onChange={(e) => update("effectiveFromMonth", Number(e.target.value))}
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
            value={values.effectiveFromYear}
            onChange={(e) => update("effectiveFromYear", Number(e.target.value))}
            disabled={busy}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-monthly-fee`}>{dict.monthlyFee}</Label>
          <Input
            id={`${idPrefix}-monthly-fee`}
            type="number"
            min={0}
            step="0.01"
            value={values.monthlyFee}
            onChange={(e) => update("monthlyFee", Number(e.target.value))}
            disabled={busy}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-payments-count`}>{dict.paymentsCount}</Label>
          <Input
            id={`${idPrefix}-payments-count`}
            type="number"
            min={1}
            max={24}
            value={values.paymentsCount}
            onChange={(e) => update("paymentsCount", Number(e.target.value))}
            disabled={busy}
            required
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-period-month`}>{dict.periodStartMonth}</Label>
          <select
            id={`${idPrefix}-period-month`}
            value={values.periodStartMonth}
            onChange={(e) => update("periodStartMonth", Number(e.target.value))}
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
          <Label htmlFor={`${idPrefix}-period-year`}>{dict.periodStartYear}</Label>
          <Input
            id={`${idPrefix}-period-year`}
            type="number"
            min={2000}
            max={2100}
            value={values.periodStartYear}
            onChange={(e) => update("periodStartYear", Number(e.target.value))}
            disabled={busy}
            required
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.chargesEnrollmentFee}
          onChange={(e) => update("chargesEnrollmentFee", e.target.checked)}
          disabled={busy}
        />
        <span>{dict.chargesEnrollmentFee}</span>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
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
