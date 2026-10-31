import type { Dictionary } from "@/types/i18n";
import { formatOfferAmount, publishedMonthlyAmount } from "@/lib/pulsar/centrolistoCommercialOffer";
import type { PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarOfferPriceProps {
  locale: string;
  dict: Dictionary;
  slug: PulsarSolutionSlug;
}

export function PulsarOfferPrice({ locale, dict, slug }: PulsarOfferPriceProps) {
  const copy = dict.pulsar.pricing;
  const amount = publishedMonthlyAmount(slug);

  if (amount === 0) {
    return (
      <p className="mt-4">
        <span className="font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.free}</span>
        <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{copy.withTemplates}</span>
      </p>
    );
  }

  return (
    <p className="mt-4">
      <span className="font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">
        {formatOfferAmount(amount, locale)}
      </span>
      <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">{copy.perMonthTax}</span>
    </p>
  );
}
