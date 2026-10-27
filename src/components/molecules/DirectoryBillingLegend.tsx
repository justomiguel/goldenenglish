import type { Dictionary } from "@/types/i18n";
import { DirectoryBillingMark } from "@/components/molecules/DirectoryBillingMark";

type UserLabels = Dictionary["admin"]["users"];

export function DirectoryBillingLegend({ labels }: { labels: UserLabels }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-foreground)]">
      <span className="font-medium">{labels.billingLegendIntro}</span>
      <span className="inline-flex items-center gap-1">
        <DirectoryBillingMark
          status="yes"
          yesLabel={labels.billingMarkYes}
          noLabel={labels.billingMarkNo}
          yesTitle={labels.billingLegendYes}
          noTitle={labels.billingLegendNo}
          naTitle={labels.billingLegendNa}
        />
        {labels.billingLegendYes}
      </span>
      <span className="inline-flex items-center gap-1">
        <DirectoryBillingMark
          status="no"
          yesLabel={labels.billingMarkYes}
          noLabel={labels.billingMarkNo}
          yesTitle={labels.billingLegendYes}
          noTitle={labels.billingLegendNo}
          naTitle={labels.billingLegendNa}
        />
        {labels.billingLegendNo}
      </span>
      <span className="inline-flex items-center gap-1 text-[var(--color-muted-foreground)]">
        <span aria-hidden>—</span>
        {labels.billingLegendNa}
      </span>
    </p>
  );
}
