import type { MzGuideLabels, MzGuideStageView } from "@/lib/landing/mozarthitos/buildFamilyGuideView";

export interface FamilyGuideStageDetailsProps {
  stage: MzGuideStageView;
  labels: MzGuideLabels;
}

export function FamilyGuideStageDetails({ stage, labels }: FamilyGuideStageDetailsProps) {
  const rows = [
    { term: labels.inClassLabel, value: stage.inClass },
    { term: labels.yourPartLabel, value: stage.yourPart },
    { term: labels.lengthLabel, value: stage.length },
  ];
  return (
    <dl className="space-y-3 text-[0.9375rem] leading-relaxed text-[var(--mz-ink-on-white)]">
      {rows.map((row) => (
        <div key={row.term}>
          <dt className="text-sm font-bold text-[var(--mz-pink-deep)]">{row.term}</dt>
          <dd className="mt-0.5">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
