"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mic, RotateCcw } from "lucide-react";
import {
  MZ_GUIDE_AGE_BANDS,
  MZ_GUIDE_ATTENDANCE,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";
import type { MzGuideLabels } from "@/lib/landing/mozarthitos/buildFamilyGuideView";
import type { MozarthitosFamilyGuideState } from "@/hooks/useMozarthitosFamilyGuide";
import { FamilyGuideStageDesktop } from "@/components/desktop/molecules/FamilyGuideStageDesktop";
import {
  MZ_GUIDE_CHOICE_CLASS,
  MZ_GUIDE_PRIMARY_CTA_CLASS,
  MZ_GUIDE_TEXT_BUTTON_CLASS,
} from "@/components/molecules/familyGuideStyles";

export interface FamilyGuideDesktopProps {
  guide: MozarthitosFamilyGuideState;
  labels: MzGuideLabels;
}

export function FamilyGuideDesktop({ guide, labels }: FamilyGuideDesktopProps) {
  const { data, handlers } = guide;
  const stepLabel = labels.stepLabel
    .replace("{current}", String(data.stepNumber))
    .replace("{total}", String(data.totalSteps));

  if (data.step !== "result" || !data.view) {
    const isAge = data.step === "age";
    const options = isAge
      ? MZ_GUIDE_AGE_BANDS.map((id) => ({ id, label: labels.age[id], pick: () => handlers.chooseAge(id) }))
      : MZ_GUIDE_ATTENDANCE.map((id) => ({
          id,
          label: labels.attendance[id],
          pick: () => handlers.chooseAttendance(id),
        }));
    return (
      <section aria-labelledby="mz-guide-question" className="mt-10">
        <p className="text-sm font-semibold text-[var(--mz-pink-deep)]">{stepLabel}</p>
        <h2
          id="mz-guide-question"
          className="mt-2 text-2xl font-bold text-[var(--mz-ink-on-white)] md:text-3xl"
        >
          {isAge ? labels.ageQuestion : labels.attendanceQuestion}
        </h2>
        <div className={`mt-6 grid gap-4 grid-cols-3`}>
          {options.map((option) => (
            <button key={option.id} type="button" onClick={option.pick} className={`${MZ_GUIDE_CHOICE_CLASS} min-h-[88px] text-lg`}>
              <span>{option.label}</span>
              <ArrowRight className="h-5 w-5 shrink-0 text-[var(--mz-blue-btn)]" aria-hidden />
            </button>
          ))}
        </div>
        {isAge ? null : (
          <button type="button" onClick={handlers.back} className={`${MZ_GUIDE_TEXT_BUTTON_CLASS} mt-6`}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {labels.back}
          </button>
        )}
      </section>
    );
  }

  const view = data.view;
  return (
    <section aria-labelledby="mz-guide-result-kicker" className="mt-10" aria-live="polite">
      <p id="mz-guide-result-kicker" className="text-sm font-semibold text-[var(--mz-pink-deep)]">{labels.resultKicker}</p>
      {view.kind === "waitlist" ? (
        <div className="mt-3 max-w-2xl">
          <h2 className="text-3xl font-bold text-[var(--mz-ink-on-white)]">
            {view.title}
          </h2>
          <p className="mt-3 text-lg text-[var(--mz-ink-on-white)]/85">{view.body}</p>
          <Link href={view.href} className={`${MZ_GUIDE_PRIMARY_CTA_CLASS} mt-6`}>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            {view.cta}
          </Link>
        </div>
      ) : (
        <div className="mt-3 space-y-12">
          <div>
            <FamilyGuideStageDesktop stage={view.primary} labels={labels} />
          </div>
          {view.secondary ? (
            <div className="border-t border-[color-mix(in_srgb,var(--mz-yellow)_45%,transparent)] pt-10">
              <p className="mb-4 text-sm font-semibold text-[var(--mz-pink-deep)]">{labels.alsoTitle}</p>
              <FamilyGuideStageDesktop stage={view.secondary} labels={labels} />
            </div>
          ) : null}
          {view.choir ? (
            <Link href={view.choir.href} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
              <Mic className="h-4 w-4 shrink-0" aria-hidden />
              {view.choir.label}
            </Link>
          ) : null}
        </div>
      )}
      <div className="mt-8 flex gap-6">
        <button type="button" onClick={handlers.back} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {labels.back}
        </button>
        <button type="button" onClick={handlers.restart} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          {labels.restart}
        </button>
      </div>
    </section>
  );
}
