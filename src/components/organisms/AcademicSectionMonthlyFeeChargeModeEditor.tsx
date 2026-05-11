"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { MONTHLY_FEE_CHARGE_MODES, type MonthlyFeeChargeMode } from "@/lib/billing/monthlyFeeChargeMode";
import { updateAcademicSectionMonthlyFeeChargeModeAction } from "@/app/[locale]/dashboard/admin/academic/sectionMonthlyFeeChargeModeActions";

type Dict = Dictionary["dashboard"]["academicSectionPage"]["monthlyFeeChargeMode"];

export interface AcademicSectionMonthlyFeeChargeModeEditorProps {
  locale: string;
  sectionId: string;
  initialMode: MonthlyFeeChargeMode;
  dict: Dict;
}

export function AcademicSectionMonthlyFeeChargeModeEditor({
  locale,
  sectionId,
  initialMode,
  dict,
}: AcademicSectionMonthlyFeeChargeModeEditorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<MonthlyFeeChargeMode>(initialMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty = mode !== initialMode;

  const submit = () => {
    if (!dirty || pending) return;
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      const res = await updateAcademicSectionMonthlyFeeChargeModeAction({
        locale,
        sectionId,
        monthlyFeeChargeMode: mode,
      });
      if (!res.ok) {
        setErrorMessage(dict.errorSave);
        return;
      }
      setOkMessage(dict.saved);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>

      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <Label htmlFor={`section-monthly-charge-mode-${sectionId}`}>{dict.modeLabel}</Label>
          <select
            id={`section-monthly-charge-mode-${sectionId}`}
            className="mt-1 w-full max-w-md rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={mode}
            onChange={(e) => setMode(e.target.value as MonthlyFeeChargeMode)}
            disabled={pending}
            aria-label={dict.selectAria}
          >
            {MONTHLY_FEE_CHARGE_MODES.map((m) => (
              <option key={m} value={m}>
                {m === "prorate_by_classes" ? dict.optionProrate : dict.optionFullMonth}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
            {mode === "prorate_by_classes" ? dict.optionProrateHelp : dict.optionFullMonthHelp}
          </p>
        </div>

        {errorMessage ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {okMessage ? (
          <p className="text-sm text-[var(--color-success)]" role="status">
            {okMessage}
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            className="min-h-[44px]"
            isLoading={pending}
            disabled={pending || !dirty}
          >
            {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
