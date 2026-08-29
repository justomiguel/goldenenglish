"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { updateAcademicCohortFeeDefaultsAction } from "@/app/[locale]/dashboard/admin/academic/cohortFeeDefaultsActions";
import { parseOptionalFeeAmount } from "@/lib/billing/resolveCohortFeeDefaults";

type FeeDefaultsDict = Dictionary["dashboard"]["academicCohortPage"]["feeDefaults"];

export interface AcademicCohortFeeDefaultsEditorProps {
  locale: string;
  cohortId: string;
  archived: boolean;
  initialEnrollment: number | null;
  initialMonthly: number | null;
  initialMode?: "per_section" | "once_for_all";
  canUseOnceForAll?: boolean;
  initialOffersTrial?: boolean;
  initialTrialFeeAmount?: number;
  dict: FeeDefaultsDict;
}

function amountToRaw(value: number | null): string {
  return value == null ? "" : String(value);
}

export function AcademicCohortFeeDefaultsEditor({
  locale,
  cohortId,
  archived,
  initialEnrollment,
  initialMonthly,
  initialMode = "per_section",
  canUseOnceForAll = true,
  initialOffersTrial = false,
  initialTrialFeeAmount = 0,
  dict,
}: AcademicCohortFeeDefaultsEditorProps) {
  const router = useRouter();
  const [enrollmentRaw, setEnrollmentRaw] = useState(() => amountToRaw(initialEnrollment));
  const [monthlyRaw, setMonthlyRaw] = useState(() => amountToRaw(initialMonthly));
  const [mode, setMode] = useState<"per_section" | "once_for_all">(initialMode);
  const [offersTrial, setOffersTrial] = useState(initialOffersTrial);
  const [trialFeeRaw, setTrialFeeRaw] = useState(() => String(initialTrialFeeAmount));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const enrollment = parseOptionalFeeAmount(enrollmentRaw);
  const monthly = parseOptionalFeeAmount(monthlyRaw);
  const trialFee = parseOptionalFeeAmount(trialFeeRaw) ?? 0;
  const enrollmentValid = enrollmentRaw.trim() === "" || enrollment != null;
  const monthlyValid = monthlyRaw.trim() === "" || monthly != null;
  const trialValid = trialFeeRaw.trim() !== "" && Number.isFinite(trialFee) && trialFee >= 0;
  const dirty =
    enrollment !== initialEnrollment ||
    monthly !== initialMonthly ||
    mode !== initialMode ||
    offersTrial !== initialOffersTrial ||
    trialFee !== initialTrialFeeAmount;
  const valid = enrollmentValid && monthlyValid && trialValid;

  const handleSubmit = () => {
    if (!valid || !dirty || pending || archived) return;
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      const res = await updateAcademicCohortFeeDefaultsAction({
        locale,
        cohortId,
        defaultEnrollmentFeeAmount: enrollment,
        defaultMonthlyFee: monthly,
        enrollmentFeeMode: mode,
        offersTrial,
        trialFeeAmount: trialFee,
      });
      if (!res.ok) {
        setErrorMessage(
          res.code === "ARCHIVED"
            ? dict.errorArchived
            : res.code === "ONCE_FOR_ALL"
              ? dict.errorOnceForAll
              : dict.errorSave,
        );
        return;
      }
      setOkMessage(dict.saved);
      router.refresh();
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <Label htmlFor={`cohort-default-enrollment-${cohortId}`}>{dict.enrollmentLabel}</Label>
          <Input
            id={`cohort-default-enrollment-${cohortId}`}
            className="mt-1"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={enrollmentRaw}
            onChange={(e) => setEnrollmentRaw(e.target.value)}
            disabled={pending || archived}
          />
        </div>
        <div>
          <Label htmlFor={`cohort-default-monthly-${cohortId}`}>{dict.monthlyLabel}</Label>
          <Input
            id={`cohort-default-monthly-${cohortId}`}
            className="mt-1"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={monthlyRaw}
            onChange={(e) => setMonthlyRaw(e.target.value)}
            disabled={pending || archived}
          />
        </div>
        <fieldset className="sm:col-span-2">
          <legend className="text-sm font-medium text-[var(--color-foreground)]">{dict.modeLabel}</legend>
          <div className="mt-2 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`cohort-fee-mode-${cohortId}`}
                checked={mode === "per_section"}
                onChange={() => setMode("per_section")}
                disabled={pending || archived}
              />
              {dict.modePerSection}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`cohort-fee-mode-${cohortId}`}
                checked={mode === "once_for_all"}
                onChange={() => setMode("once_for_all")}
                disabled={pending || archived || !canUseOnceForAll}
              />
              {dict.modeOnceForAll}
            </label>
          </div>
          {!canUseOnceForAll ? (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.modeOnceDisabled}</p>
          ) : null}
        </fieldset>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={offersTrial}
            onChange={(e) => setOffersTrial(e.target.checked)}
            disabled={pending || archived}
          />
          {dict.offersTrialLabel}
        </label>
        <div className="sm:col-span-2">
          <Label htmlFor={`cohort-trial-fee-${cohortId}`}>{dict.trialFeeLabel}</Label>
          <Input
            id={`cohort-trial-fee-${cohortId}`}
            className="mt-1"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={trialFeeRaw}
            onChange={(e) => setTrialFeeRaw(e.target.value)}
            disabled={pending || archived || !offersTrial}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.trialFeeHint}</p>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)] sm:col-span-2">{dict.emptyHint}</p>
        <div className="flex items-center gap-2 sm:col-span-2">
          <Button
            type="submit"
            disabled={pending || archived || !dirty || !valid}
            isLoading={pending}
            className="min-h-[44px]"
          >
            {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.save}
          </Button>
        </div>
        {errorMessage ? (
          <p className="text-sm text-[var(--color-error)] sm:col-span-2" role="status">
            {errorMessage}
          </p>
        ) : null}
        {okMessage && !errorMessage ? (
          <p className="text-sm text-[var(--color-success)] sm:col-span-2" role="status">
            {okMessage}
          </p>
        ) : null}
      </form>
    </section>
  );
}
