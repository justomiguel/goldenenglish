"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { updateAcademicSectionAdvanceMonthlyPaymentAction } from "@/app/[locale]/dashboard/admin/academic/sectionAdvancePaymentActions";

type Dict = Dictionary["dashboard"]["academicSectionPage"]["allowAdvanceMonthlyPayment"];

export interface AcademicSectionAdvanceMonthlyPaymentEditorProps {
  locale: string;
  sectionId: string;
  initialAllowAdvance: boolean;
  dict: Dict;
}

export function AcademicSectionAdvanceMonthlyPaymentEditor({
  locale,
  sectionId,
  initialAllowAdvance,
  dict,
}: AcademicSectionAdvanceMonthlyPaymentEditorProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(initialAllowAdvance);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty = allowed !== initialAllowAdvance;

  const submit = () => {
    if (!dirty || pending) return;
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      const res = await updateAcademicSectionAdvanceMonthlyPaymentAction({
        locale,
        sectionId,
        allowAdvanceMonthlyPayment: allowed,
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
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
            checked={allowed}
            onChange={(e) => setAllowed(e.target.checked)}
            disabled={pending}
            aria-describedby={`section-advance-payment-help-${sectionId}`}
          />
          <span className="text-sm text-[var(--color-foreground)]">{dict.toggleLabel}</span>
        </label>
        <p
          id={`section-advance-payment-help-${sectionId}`}
          className="text-xs text-[var(--color-muted-foreground)]"
        >
          {dict.toggleHelp}
        </p>

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
          <Button type="submit" className="min-h-[44px]" isLoading={pending} disabled={pending || !dirty}>
            {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.save}
          </Button>
        </div>
      </form>
    </section>
  );
}
