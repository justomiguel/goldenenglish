import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type {
  MzGuideLabels,
  MzGuideStageView,
} from "@/lib/landing/mozarthitos/buildFamilyGuideView";
import { MozarthitosGuideStageDetails } from "@/components/molecules/MozarthitosGuideStageDetails";
import { MZ_GUIDE_PRIMARY_CTA_CLASS } from "@/components/molecules/mozarthitosGuideStyles";

export interface MozarthitosGuideStageDesktopProps {
  stage: MzGuideStageView;
  labels: MzGuideLabels;
}

export function MozarthitosGuideStageDesktop({ stage, labels }: MozarthitosGuideStageDesktopProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div>
        <h2 className="font-[family-name:var(--font-mz-display)] text-3xl font-bold text-[var(--mz-ink-on-white)]">
          {stage.title}
        </h2>
        <p className="mt-1 text-base font-semibold text-[var(--mz-ink-on-white)]/80">{stage.ages}</p>
        <div className="mt-5">
          <MozarthitosGuideStageDetails stage={stage} labels={labels} />
        </div>
      </div>
      <ul className="space-y-4">
        {stage.offers.map((offer) => (
          <li
            key={offer.id}
            className="rounded-[22px] border border-[color-mix(in_srgb,var(--mz-yellow)_55%,transparent)] bg-[var(--mz-white)] p-5"
          >
            <p className="text-lg font-bold text-[var(--mz-ink-on-white)]">{offer.title}</p>
            <p className="mt-1 text-sm text-[var(--mz-ink-on-white)]/85">{offer.body}</p>
            {offer.place ? (
              <p className="mt-1 text-sm font-semibold text-[var(--mz-ink-on-white)]">{offer.place}</p>
            ) : null}
            <Link href={offer.href} className={`${MZ_GUIDE_PRIMARY_CTA_CLASS} mt-4 w-full`}>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              {offer.cta}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
