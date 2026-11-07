"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { MozarthitosFamilyGuideDesktop } from "@/components/desktop/organisms/MozarthitosFamilyGuideDesktop";
import { MozarthitosFamilyGuidePwa } from "@/components/pwa/organisms/MozarthitosFamilyGuidePwa";
import {
  useMozarthitosFamilyGuide,
  type MzFamilyGuideAnswers,
} from "@/hooks/useMozarthitosFamilyGuide";
import type { MzGuideLabels } from "@/lib/landing/mozarthitos/buildFamilyGuideView";

export interface MozarthitosFamilyGuideEntryProps {
  locale: string;
  labels: MzGuideLabels;
  place: string;
  initial: MzFamilyGuideAnswers;
}

export function MozarthitosFamilyGuideEntry({
  locale,
  labels,
  place,
  initial,
}: MozarthitosFamilyGuideEntryProps) {
  const guide = useMozarthitosFamilyGuide({ locale, labels, place, initial });
  return (
    <SurfaceMountGate
      skeleton={<div className="mt-10 min-h-[320px]" aria-busy="true" />}
      desktop={<MozarthitosFamilyGuideDesktop guide={guide} labels={labels} />}
      narrow={() => <MozarthitosFamilyGuidePwa guide={guide} labels={labels} />}
    />
  );
}
