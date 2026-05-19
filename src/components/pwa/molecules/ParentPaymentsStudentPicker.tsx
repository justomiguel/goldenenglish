"use client";

import type { ChangeEvent } from "react";
import { useMemo } from "react";
import { Label } from "@/components/atoms/Label";
import { formatParentPaymentsPickerOption } from "@/lib/billing/formatParentPaymentsPickerOption";
import type { FamilyPaymentsSummary } from "@/lib/billing/buildFamilyPaymentsSummary";
import type { TutorLinkedStudentOption } from "@/components/parent/ParentPaymentsEntry";
import type { Dictionary, Locale } from "@/types/i18n";

type PwaLabels = Dictionary["dashboard"]["parent"]["paymentsPwa"];

export interface ParentPaymentsStudentPickerProps {
  locale: Locale;
  pickerLabel: string;
  options: TutorLinkedStudentOption[];
  selectedStudentId: string | null;
  familySummary: FamilyPaymentsSummary;
  pwaLabels: PwaLabels;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export function ParentPaymentsStudentPicker({
  locale,
  pickerLabel,
  options,
  selectedStudentId,
  familySummary,
  pwaLabels,
  onChange,
}: ParentPaymentsStudentPickerProps) {
  const subtotalByStudentId = useMemo(() => {
    const map = new Map<string, number>();
    for (const child of familySummary.children) {
      map.set(child.studentId, child.subtotal);
    }
    return map;
  }, [familySummary.children]);

  const optionLabels = {
    pending: pwaLabels.childPickerOptionPending,
    settled: pwaLabels.childPickerOptionSettled,
  };

  if (options.length === 1) {
    const only = options[0]!;
    const subtotal = subtotalByStudentId.get(only.studentId) ?? 0;
    const singleLine = formatParentPaymentsPickerOption(
      locale,
      only.displayName,
      subtotal,
      optionLabels,
    );
    return (
      <div className="relative isolate">
        <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{pickerLabel}</p>
        <p className="mt-1 text-base font-semibold text-[var(--color-foreground)]">{singleLine}</p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{pwaLabels.gridPickerHint}</p>
      </div>
    );
  }

  return (
    <div className="relative isolate">
      <Label htmlFor="tutor-payments-picker-pwa">{pickerLabel}</Label>
      <select
        id="tutor-payments-picker-pwa"
        name="studentId"
        value={selectedStudentId ?? ""}
        onChange={onChange}
        className="mt-1 block min-h-[44px] w-full appearance-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
      >
        {options.map((option) => {
          const subtotal = subtotalByStudentId.get(option.studentId) ?? 0;
          const label = formatParentPaymentsPickerOption(
            locale,
            option.displayName,
            subtotal,
            optionLabels,
          );
          return (
            <option key={option.studentId} value={option.studentId}>
              {label}
            </option>
          );
        })}
      </select>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{pwaLabels.gridPickerHint}</p>
    </div>
  );
}
