import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export interface PulsarHomeCloseProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarHomeClose({ locale, dict, market = "cl" }: PulsarHomeCloseProps) {
  const copy = dict.pulsar.home;
  const free = withCentrolistoMarket(`/${locale}/cuenta/registro`, market);

  return (
    <section className="border-t border-[var(--color-border)] lg:flex lg:min-h-[100dvh] lg:items-center">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 className="max-w-xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.house.closeTitle}
        </h2>
        <div className="mt-8">
          <PulsarActionLink href={free} tone="primary" eventName="cl_create_free_page">
            {copy.freeSiteCta}
          </PulsarActionLink>
        </div>
      </div>
    </section>
  );
}
