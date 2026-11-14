"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { AcademicNewCohortFeeField } from "@/components/molecules/AcademicNewCohortFeeField";
import { createAcademicCohortAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import { useAdminTourSessionActive } from "@/lib/admin-tutorials/client/adminTourSession";
import { failureSentenceForCode } from "@/lib/academics/parseNewCohortDraft";

export interface AcademicNewCohortModalProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCohorts: readonly { id: string; name: string }[];
  dict: {
    title: string;
    nameLabel: string;
    chargesEnrollmentLabel: string;
    enrollmentAmountLabel: string;
    chargesMonthlyLabel: string;
    monthlyAmountLabel: string;
    copySectionsLabel: string;
    sourceLabel: string;
    sourcePlaceholder: string;
    copyStudentsLabel: string;
    copyStudentsHint: string;
    submit: string;
    cancel: string;
    openCohort: string;
    errors: Record<string, string>;
  };
}

export function AcademicNewCohortModal({
  locale,
  open,
  onOpenChange,
  sourceCohorts,
  dict,
}: AcademicNewCohortModalProps) {
  const tourActive = useAdminTourSessionActive();
  const [retainStackedAfterTour, setRetainStackedAfterTour] = useState(false);
  const [name, setName] = useState("");
  const [chargesFee, setChargesFee] = useState(false);
  const [amount, setAmount] = useState("");
  const [chargesMonthly, setChargesMonthly] = useState(false);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [copySections, setCopySections] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [copyStudents, setCopyStudents] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (open && tourActive && !retainStackedAfterTour) {
    setRetainStackedAfterTour(true);
  } else if (!open && retainStackedAfterTour) {
    setRetainStackedAfterTour(false);
  }

  const reset = () => {
    setName("");
    setChargesFee(false);
    setAmount("");
    setChargesMonthly(false);
    setMonthlyAmount("");
    setCopySections(false);
    setSourceId("");
    setCopyStudents(false);
    setErr(null);
    setCreatedId(null);
  };

  const submit = () => {
    setErr(null);
    start(async () => {
      const r = await createAcademicCohortAction({
        locale,
        name,
        chargesEnrollmentFee: chargesFee,
        enrollmentFeeAmount: amount,
        chargesMonthlyFee: chargesMonthly,
        monthlyFeeAmount: monthlyAmount,
        copySections,
        sourceCohortId: sourceId,
        copyStudents,
      });
      if (!r.ok) {
        setErr(failureSentenceForCode(r.code, dict.errors));
        if (r.cohortId) setCreatedId(r.cohortId);
        return;
      }
      reset();
      onOpenChange(false);
      window.location.assign(`/${locale}/dashboard/admin/academic/${r.id}`);
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="new-cohort-title"
      title={dict.title}
      disableClose={pending}
      stackBelowTour={tourActive || retainStackedAfterTour}
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="nc-name">{dict.nameLabel}</Label>
          <input
            id="nc-name"
            data-tour="academic-new-cohort-name"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending || createdId != null}
          />
        </div>
        <AcademicNewCohortFeeField
          checkboxId="nc-fee-on"
          checked={chargesFee}
          onChecked={setChargesFee}
          label={dict.chargesEnrollmentLabel}
          amountId="nc-fee"
          amountLabel={dict.enrollmentAmountLabel}
          amount={amount}
          onAmount={setAmount}
          disabled={pending || createdId != null}
        />
        <AcademicNewCohortFeeField
          checkboxId="nc-monthly-on"
          checked={chargesMonthly}
          onChecked={setChargesMonthly}
          label={dict.chargesMonthlyLabel}
          amountId="nc-monthly"
          amountLabel={dict.monthlyAmountLabel}
          amount={monthlyAmount}
          onAmount={setMonthlyAmount}
          disabled={pending || createdId != null}
        />
        <label className="flex min-h-[44px] items-center gap-3 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={copySections}
            disabled={pending || createdId != null || sourceCohorts.length === 0}
            onChange={(e) => {
              setCopySections(e.target.checked);
              if (!e.target.checked) {
                setSourceId("");
                setCopyStudents(false);
              }
            }}
          />
          {dict.copySectionsLabel}
        </label>
        {copySections ? (
          <div>
            <Label htmlFor="nc-source">{dict.sourceLabel}</Label>
            <select
              id="nc-source"
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              value={sourceId}
              disabled={pending || createdId != null}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">{dict.sourcePlaceholder}</option>
              {sourceCohorts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {copySections && sourceId ? (
          <div>
            <label className="flex min-h-[44px] items-center gap-3 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={copyStudents}
                disabled={pending || createdId != null}
                onChange={(e) => setCopyStudents(e.target.checked)}
              />
              {dict.copyStudentsLabel}
            </label>
            <p className="text-xs text-[var(--color-muted-foreground)]">{dict.copyStudentsHint}</p>
          </div>
        ) : null}
        {err ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {err}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {createdId ? (
            <Button
              type="button"
              onClick={() => {
                window.location.assign(`/${locale}/dashboard/admin/academic/${createdId}`);
              }}
            >
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              {dict.openCohort}
            </Button>
          ) : (
            <>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
                {!pending ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {dict.cancel}
              </Button>
              <Button
                type="button"
                isLoading={pending}
                disabled={pending || name.trim().length < 2}
                onClick={submit}
                data-tour="academic-new-cohort-submit"
              >
                {!pending ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {dict.submit}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
