"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  MzGuideAgeBand,
  MzGuideAttendance,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";
import { resolveFamilyGuide } from "@/lib/landing/mozarthitos/resolveFamilyGuide";
import {
  MZ_GUIDE_AGE_PARAM,
  MZ_GUIDE_ATTENDANCE_PARAM,
} from "@/lib/landing/mozarthitos/guideToken";
import {
  buildFamilyGuideView,
  type MzFamilyGuideView,
  type MzGuideLabels,
} from "@/lib/landing/mozarthitos/buildFamilyGuideView";

export type MzFamilyGuideStep = "age" | "attendance" | "result";

export interface MzFamilyGuideAnswers {
  ageBand: MzGuideAgeBand | null;
  attendance: MzGuideAttendance | null;
}

export const MZ_FAMILY_GUIDE_TOTAL_STEPS = 2;

interface UseMozarthitosFamilyGuideArgs {
  locale: string;
  labels: MzGuideLabels;
  place: string;
  initial: MzFamilyGuideAnswers;
}

function stepFor(answers: MzFamilyGuideAnswers): MzFamilyGuideStep {
  if (!answers.ageBand) return "age";
  if (!answers.attendance) return "attendance";
  return "result";
}

export function useMozarthitosFamilyGuide({
  locale,
  labels,
  place,
  initial,
}: UseMozarthitosFamilyGuideArgs) {
  const router = useRouter();
  const pathname = usePathname();
  const [answers, setAnswers] = useState<MzFamilyGuideAnswers>(initial);

  const commit = (next: MzFamilyGuideAnswers) => {
    setAnswers(next);
    const query = new URLSearchParams();
    if (next.ageBand) query.set(MZ_GUIDE_AGE_PARAM, next.ageBand);
    if (next.attendance) query.set(MZ_GUIDE_ATTENDANCE_PARAM, next.attendance);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const step = stepFor(answers);
  const view: MzFamilyGuideView | null =
    answers.ageBand && answers.attendance
      ? buildFamilyGuideView({
          locale,
          ageBand: answers.ageBand,
          result: resolveFamilyGuide({ ageBand: answers.ageBand, attendance: answers.attendance }),
          labels,
          place,
        })
      : null;

  return {
    data: {
      step,
      stepNumber: step === "age" ? 1 : 2,
      totalSteps: MZ_FAMILY_GUIDE_TOTAL_STEPS,
      answers,
      view,
    },
    error: null,
    isLoading: false,
    handlers: {
      chooseAge: (ageBand: MzGuideAgeBand) => commit({ ...answers, ageBand }),
      chooseAttendance: (attendance: MzGuideAttendance) => commit({ ...answers, attendance }),
      back: () =>
        commit(
          step === "result"
            ? { ...answers, attendance: null }
            : { ageBand: null, attendance: answers.attendance },
        ),
      restart: () => commit({ ageBand: null, attendance: null }),
    },
  };
}

export type MozarthitosFamilyGuideState = ReturnType<typeof useMozarthitosFamilyGuide>;
