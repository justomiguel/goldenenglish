"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { setSectionEnrollmentFeeAmountAction } from "@/app/[locale]/dashboard/admin/academic/sectionEnrollmentFeeActions";

type EnrollmentDict =
  Dictionary["dashboard"]["academicSectionPage"]["enrollmentFee"];

export interface AcademicSectionEnrollmentFeeEditorProps {
  locale: string;
  sectionId: string;
  initialAmount: number;
  /**
   * Moneda del plan vigente (la matrícula reusa la moneda de la cuota mensual).
   * Si no hay plan vigente en la sección, viene `null` y solo se muestra el
   * input numérico sin sufijo de moneda.
   */
  currentPlanCurrency: string | null;
  dict: EnrollmentDict;
}

export function AcademicSectionEnrollmentFeeEditor({
  locale,
  sectionId,
  initialAmount,
  currentPlanCurrency,
  dict,
}: AcademicSectionEnrollmentFeeEditorProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(
    Number.isFinite(initialAmount) && initialAmount >= 0 ? initialAmount : 0,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty = amount !== initialAmount;
  const valid = Number.isFinite(amount) && amount >= 0;

  const handleSubmit = () => {
    if (!valid || !dirty || pending) return;
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      const res = await setSectionEnrollmentFeeAmountAction({
        locale,
        sectionId,
        enrollmentFeeAmount: amount,
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
      <h2 className="text-base font-semibold text-[var(--color-primary)]">
        {dict.title}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        {dict.lead}
      </p>

      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <Label htmlFor={`section-enrollment-fee-${sectionId}`}>{dict.amount}</Label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id={`section-enrollment-fee-${sectionId}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              disabled={pending}
              required
            />
            <span
              className="text-sm font-medium text-[var(--color-foreground)]"
              aria-label={dict.currencyAria}
            >
              {currentPlanCurrency ?? dict.noCurrency}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {currentPlanCurrency ? dict.currencyHelp : dict.noActivePlanHelp}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={pending || !dirty || !valid}
            isLoading={pending}
            className="min-h-[44px]"
          >
            {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.save}
          </Button>
          {amount === 0 ? (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {dict.zeroMeans}
            </span>
          ) : null}
        </div>

        {errorMessage ? (
          <p className="text-sm text-[var(--color-error)]" role="status">
            {errorMessage}
          </p>
        ) : null}
        {okMessage && !errorMessage ? (
          <p className="text-sm text-[var(--color-success)]" role="status">
            {okMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}
