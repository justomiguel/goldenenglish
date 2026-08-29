"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { setSectionTrialOfferAction } from "@/app/[locale]/dashboard/admin/academic/sectionTrialOfferActions";

type TrialOfferDict = Dictionary["dashboard"]["academicSectionPage"]["trialOffer"];

export interface AcademicSectionTrialOfferEditorProps {
  locale: string;
  sectionId: string;
  initialOffersTrial: boolean | null;
  initialTrialFeeAmount: number | null;
  cohortOffersTrial: boolean;
  cohortTrialFeeAmount: number;
  dict: TrialOfferDict;
  embedded?: boolean;
}

function offersToMode(value: boolean | null): "inherit" | "yes" | "no" {
  if (value == null) return "inherit";
  return value ? "yes" : "no";
}

export function AcademicSectionTrialOfferEditor({
  locale,
  sectionId,
  initialOffersTrial,
  initialTrialFeeAmount,
  cohortOffersTrial,
  cohortTrialFeeAmount,
  dict,
  embedded = false,
}: AcademicSectionTrialOfferEditorProps) {
  const router = useRouter();
  const [offersMode, setOffersMode] = useState(() => offersToMode(initialOffersTrial));
  const [amountRaw, setAmountRaw] = useState(() =>
    initialTrialFeeAmount == null ? "" : String(initialTrialFeeAmount),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const trimmed = amountRaw.trim();
  const amount = trimmed === "" ? null : Number(amountRaw);
  const offersTrial = offersMode === "inherit" ? null : offersMode === "yes";
  const dirty = offersTrial !== initialOffersTrial || amount !== initialTrialFeeAmount;
  const valid = amount == null || (Number.isFinite(amount) && amount >= 0);

  const handleSubmit = () => {
    if (!valid || !dirty || pending) return;
    setErrorMessage(null);
    setOkMessage(null);
    start(async () => {
      const res = await setSectionTrialOfferAction({
        locale,
        sectionId,
        offersTrial,
        trialFeeAmount: amount,
      });
      if (!res.ok) {
        setErrorMessage(dict.errorSave);
        return;
      }
      setOkMessage(dict.saved);
      router.refresh();
    });
  };

  const Heading = embedded ? "h3" : "h2";
  const shell = embedded
    ? "space-y-1"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4";

  return (
    <section className={shell}>
      <Heading
        className={
          embedded
            ? "text-sm font-semibold text-[var(--color-foreground)]"
            : "text-base font-semibold text-[var(--color-primary)]"
        }
      >
        {dict.title}
      </Heading>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <form
        className="mt-3 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <fieldset>
          <legend className="text-sm font-medium text-[var(--color-foreground)]">
            {dict.offersLabel}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {(
              [
                ["inherit", dict.offersInherit],
                ["yes", dict.offersYes],
                ["no", dict.offersNo],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`section-trial-offers-${sectionId}`}
                  checked={offersMode === value}
                  onChange={() => setOffersMode(value)}
                  disabled={pending}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor={`section-trial-fee-${sectionId}`}>{dict.amountLabel}</Label>
          <Input
            id={`section-trial-fee-${sectionId}`}
            className="mt-1"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            disabled={pending}
          />
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
            <span className="text-xs text-[var(--color-muted-foreground)]">{dict.zeroMeans}</span>
          ) : amount == null ? (
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {cohortOffersTrial
                ? dict.inheritHint.replace("{amount}", String(cohortTrialFeeAmount))
                : dict.inheritEmpty}
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
