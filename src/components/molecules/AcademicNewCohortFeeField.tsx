"use client";

import { Label } from "@/components/atoms/Label";

export interface AcademicNewCohortFeeFieldProps {
  checkboxId: string;
  checked: boolean;
  onChecked: (checked: boolean) => void;
  label: string;
  amountId: string;
  amountLabel: string;
  amount: string;
  onAmount: (amount: string) => void;
  disabled: boolean;
}

export function AcademicNewCohortFeeField({
  checkboxId,
  checked,
  onChecked,
  label,
  amountId,
  amountLabel,
  amount,
  onAmount,
  disabled,
}: AcademicNewCohortFeeFieldProps) {
  return (
    <div className="space-y-3">
      <label htmlFor={checkboxId} className="flex min-h-[44px] items-center gap-3 text-sm text-[var(--color-foreground)]">
        <input
          id={checkboxId}
          type="checkbox"
          className="h-4 w-4"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChecked(e.target.checked)}
        />
        {label}
      </label>
      {checked ? (
        <div>
          <Label htmlFor={amountId}>{amountLabel}</Label>
          <input
            id={amountId}
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={amount}
            onChange={(e) => onAmount(e.target.value)}
            disabled={disabled}
          />
        </div>
      ) : null}
    </div>
  );
}
