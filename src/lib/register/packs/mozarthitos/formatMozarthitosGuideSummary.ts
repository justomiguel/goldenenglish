import type { MzGuideChoice } from "@/lib/landing/mozarthitos/familyGuideCatalog";
import { parseMozarthitosTenantExtras } from "@/lib/register/packs/mozarthitos/parseMozarthitosTenantExtras";

export interface MozarthitosGuideLabels {
  stages: Record<MzGuideChoice["stage"], string>;
  modalities: Record<MzGuideChoice["modality"], string>;
  ages: Record<MzGuideChoice["ageBand"], string>;
}

export interface MozarthitosGuideSummaryParts {
  stage: string;
  modality: string;
  ageBand: string;
}

export function mozarthitosGuideSummaryParts(
  guide: MzGuideChoice,
  labels: MozarthitosGuideLabels,
): MozarthitosGuideSummaryParts {
  return {
    stage: labels.stages[guide.stage],
    modality: labels.modalities[guide.modality],
    ageBand: labels.ages[guide.ageBand],
  };
}

/** One-line summary for exports. Returns `""` when the row has no guide tag. */
export function formatMozarthitosGuideSummary(
  tenantExtras: unknown,
  labels: MozarthitosGuideLabels,
): string {
  const extras = parseMozarthitosTenantExtras(tenantExtras);
  if (!extras) return "";
  const parts = mozarthitosGuideSummaryParts(extras.guide, labels);
  return `${parts.stage} · ${parts.modality} · ${parts.ageBand}`;
}
