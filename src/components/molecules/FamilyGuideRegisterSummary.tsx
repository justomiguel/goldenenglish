import Link from "next/link";
import { Compass } from "lucide-react";
import type { MzGuideChoice } from "@/lib/landing/mozarthitos/familyGuideCatalog";
import { buildGuidePageHref } from "@/lib/landing/mozarthitos/guideToken";
import type { Dictionary } from "@/types/i18n";

export interface FamilyGuideRegisterSummaryProps {
  locale: string;
  guide: MzGuideChoice;
  labels: Dictionary["landing"]["mz"]["guide"];
}

export function FamilyGuideRegisterSummary({
  locale,
  guide,
  labels,
}: FamilyGuideRegisterSummaryProps) {
  const summary = labels.registerSummary
    .replace("{stage}", labels.stage[guide.stage].title)
    .replace("{modality}", labels.offer[guide.modality].title);

  return (
    <p className="mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold text-[var(--mz-ink-on-white)] md:mx-0 md:justify-start md:text-base">
      <span>{summary}</span>
      <Link
        href={buildGuidePageHref(locale)}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[var(--mz-blue-btn)] underline decoration-[var(--mz-blue-btn)]/30 underline-offset-[0.35em] transition-colors hover:decoration-[var(--mz-blue-btn)]"
      >
        <Compass className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2} />
        {labels.registerSummaryChange}
      </Link>
    </p>
  );
}
