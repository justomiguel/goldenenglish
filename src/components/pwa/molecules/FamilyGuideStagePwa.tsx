import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type {
  MzGuideLabels,
  MzGuideStageView,
} from "@/lib/landing/mozarthitos/buildFamilyGuideView";
import { FamilyGuideStageDetails } from "@/components/molecules/FamilyGuideStageDetails";

export interface FamilyGuideStagePwaProps {
  stage: MzGuideStageView;
  labels: MzGuideLabels;
}

export function FamilyGuideStagePwa({ stage, labels }: FamilyGuideStagePwaProps) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-mz-display)] text-2xl font-bold text-[var(--mz-ink-on-white)]">
        {stage.title}
      </h2>
      <p className="mt-0.5 text-sm font-semibold text-[var(--mz-ink-on-white)]/80">{stage.ages}</p>
      <div className="mt-4">
        <FamilyGuideStageDetails stage={stage} labels={labels} />
      </div>
      <ul className="mt-5 divide-y divide-[color-mix(in_srgb,var(--mz-yellow)_45%,transparent)] overflow-hidden rounded-[20px] border border-[color-mix(in_srgb,var(--mz-yellow)_55%,transparent)] bg-[var(--mz-white)]">
        {stage.offers.map((offer) => (
          <li key={offer.id}>
            <Link
              href={offer.href}
              className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors active:bg-[color-mix(in_srgb,var(--mz-yellow-soft)_60%,white)]"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-[var(--mz-ink-on-white)]">{offer.title}</span>
                <span className="mt-0.5 block text-sm text-[var(--mz-ink-on-white)]/85">{offer.body}</span>
                {offer.place ? (
                  <span className="mt-0.5 block text-sm font-semibold text-[var(--mz-ink-on-white)]">
                    {offer.place}
                  </span>
                ) : null}
                <span className="mt-1 block text-sm font-semibold text-[var(--mz-blue-btn)]">{offer.cta}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--mz-blue-btn)]" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
