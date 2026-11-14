"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { FamilyGuideDesktop } from "@/components/desktop/organisms/FamilyGuideDesktop";
import { FamilyGuidePwa } from "@/components/pwa/organisms/FamilyGuidePwa";
import {
  useMozarthitosFamilyGuide,
  type MzFamilyGuideAnswers,
} from "@/variants/owned/mozarthitos/pieces/useMozarthitosFamilyGuide";
import type { MzGuideLabels } from "@/variants/owned/mozarthitos/pieces/buildFamilyGuideView";

export interface FamilyGuideEntryProps {
  locale: string;
  labels: MzGuideLabels;
  place: string;
  initial: MzFamilyGuideAnswers;
}

export function FamilyGuideEntry({
  locale,
  labels,
  place,
  initial,
}: FamilyGuideEntryProps) {
  const guide = useMozarthitosFamilyGuide({ locale, labels, place, initial });
  return (
    <SurfaceMountGate
      skeleton={<div className="mt-10 min-h-[320px]" aria-busy="true" />}
      desktop={<FamilyGuideDesktop guide={guide} labels={labels} />}
      narrow={() => <FamilyGuidePwa guide={guide} labels={labels} />}
    />
  );
}
