"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, Mic, RotateCcw } from "lucide-react";
import {
  MZ_GUIDE_AGE_BANDS,
  MZ_GUIDE_ATTENDANCE,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";
import type { MzGuideLabels } from "@/lib/landing/mozarthitos/buildFamilyGuideView";
import type { MozarthitosFamilyGuideState } from "@/hooks/useMozarthitosFamilyGuide";
import { MozarthitosGuideStagePwa } from "@/components/pwa/molecules/MozarthitosGuideStagePwa";
import {
  MZ_GUIDE_CHOICE_CLASS,
  MZ_GUIDE_PRIMARY_CTA_CLASS,
  MZ_GUIDE_TEXT_BUTTON_CLASS,
} from "@/components/molecules/mozarthitosGuideStyles";

export interface MozarthitosFamilyGuidePwaProps {
  guide: MozarthitosFamilyGuideState;
  labels: MzGuideLabels;
}

/** Sits above `PublicPwaTabBar` (4.5rem + bottom safe area). */
const STICKY_CTA_CLASS =
  "sticky bottom-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))] z-10 -mx-4 mt-8 bg-[color-mix(in_srgb,var(--mz-white)_92%,transparent)] px-4 py-3 backdrop-blur";

export function MozarthitosFamilyGuidePwa({ guide, labels }: MozarthitosFamilyGuidePwaProps) {
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
      <section aria-labelledby="mz-guide-question" className="mt-6">
        {isAge ? null : (
          <button type="button" onClick={handlers.back} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {labels.back}
          </button>
        )}
        <p className="mt-2 text-sm font-semibold text-[var(--mz-pink-deep)]">{stepLabel}</p>
        <h2 id="mz-guide-question" className="mt-1 text-xl font-bold text-[var(--mz-ink-on-white)]">
          {isAge ? labels.ageQuestion : labels.attendanceQuestion}
        </h2>
        <ul className="mt-4 space-y-3">
          {options.map((option) => (
            <li key={option.id}>
              <button type="button" onClick={option.pick} className={`${MZ_GUIDE_CHOICE_CLASS} min-h-[56px] py-3 text-base`}>
                <span>{option.label}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--mz-blue-btn)]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const view = data.view;
  const primaryCta =
    view.kind === "waitlist"
      ? { href: view.href, label: view.cta }
      : view.primary.offers[0]
        ? { href: view.primary.offers[0].href, label: view.primary.offers[0].cta }
        : null;

  return (
    <section aria-labelledby="mz-guide-result-kicker" className="mt-6" aria-live="polite">
      <div className="flex flex-wrap gap-x-5">
        <button type="button" onClick={handlers.back} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {labels.back}
        </button>
        <button type="button" onClick={handlers.restart} className={MZ_GUIDE_TEXT_BUTTON_CLASS}>
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          {labels.restart}
        </button>
      </div>
      <p id="mz-guide-result-kicker" className="mt-2 text-sm font-semibold text-[var(--mz-pink-deep)]">{labels.resultKicker}</p>
      {view.kind === "waitlist" ? (
        <div className="mt-2">
          <h2 className="text-2xl font-bold text-[var(--mz-ink-on-white)]">
            {view.title}
          </h2>
          <p className="mt-2 text-base text-[var(--mz-ink-on-white)]/85">{view.body}</p>
        </div>
      ) : (
        <div className="mt-2 space-y-8">
          <MozarthitosGuideStagePwa stage={view.primary} labels={labels} />
          {view.secondary ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--mz-pink-deep)]">{labels.alsoTitle}</p>
              <MozarthitosGuideStagePwa stage={view.secondary} labels={labels} />
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
      {primaryCta ? (
        <div className={STICKY_CTA_CLASS}>
          <Link href={primaryCta.href} className={`${MZ_GUIDE_PRIMARY_CTA_CLASS} w-full`}>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            {primaryCta.label}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
