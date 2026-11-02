import type { Dictionary } from "@/types/i18n";
import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import {
  customLandingAmount,
  formatOfferAmount,
  publishedMonthlyAmount,
} from "@/lib/pulsar/centrolistoCommercialOffer";
import type { PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarOfferPriceProps {
  dict: Dictionary;
  slug: PulsarSolutionSlug;
  market?: CentrolistoMarketCode;
}

function landingLine(copy: Dictionary["pulsar"]["pricing"], market: CentrolistoMarketCode) {
  return `${copy.customLandingLabel}: ${formatOfferAmount(customLandingAmount(market), market)} ${copy.oneTimeTax}`;
}

export function PulsarOfferPrice({ dict, slug, market = "cl" }: PulsarOfferPriceProps) {
  const copy = dict.pulsar.pricing;
  const amount = publishedMonthlyAmount(slug, market);

  if (amount === 0) {
    return (
      <p className="mt-4">
        <span className="font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.free}</span>
        <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{copy.withTemplates}</span>
        <span className="mt-2 block text-sm text-[var(--color-muted-foreground)]">{landingLine(copy, market)}</span>
      </p>
    );
  }

  return (
    <p className="mt-4">
      <span className="font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">
        {formatOfferAmount(amount, market)}
      </span>
      <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{copy.perMonthTax}</span>
      {slug !== "gestion" ? (
        <span className="mt-2 block text-sm text-[var(--color-muted-foreground)]">{landingLine(copy, market)}</span>
      ) : null}
    </p>
  );
}
