"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";

type Btn = Dictionary["dashboard"]["siteSetup"]["buttons"];
type Intro = Dictionary["dashboard"]["siteSetup"]["intro"];

interface SiteSetupWizardNavProps {
  step: number;
  totalSteps: number;
  labelsButtons: Btn;
  introContinue: Intro["continue"];
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function SiteSetupWizardNav({
  step,
  totalSteps,
  labelsButtons,
  introContinue,
  busy,
  onBack,
  onNext,
  onFinish,
}: SiteSetupWizardNavProps) {
  const last = step >= totalSteps - 1;

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-6">
      <div>
        {step > 0 ? (
          <Button type="button" variant="ghost" size="md" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {labelsButtons.back}
          </Button>
        ) : (
          <span />
        )}
      </div>
      <div>
        {!last ? (
          <Button type="button" variant="primary" size="md" onClick={onNext}>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            {step === 0 ? introContinue : labelsButtons.continue}
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void onFinish()}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {busy ? labelsButtons.submitting : labelsButtons.finish}
          </Button>
        )}
      </div>
    </div>
  );
}
