import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarReveal } from "@/components/organisms/pulsar/PulsarReveal";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export interface PulsarHomeCloseProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarHomeClose({ locale, dict, market = "cl" }: PulsarHomeCloseProps) {
  const copy = dict.pulsar.home;

  return (
    <section className="border-t border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]">
          <Image
            src="/centrolisto/marketing/cta-editorial.jpg"
            alt={dict.pulsar.solutions.ctaImageAlt}
            fill
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
        </figure>
        <PulsarReveal from="up">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
            {copy.bottomCta.title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-foreground)]">{copy.bottomCta.lead}</p>
          <div className="mt-8">
            <PulsarActionLink href={withCentrolistoMarket(`/${locale}/cuenta/registro`, market)} tone="primary" eventName="cl_create_free_page">
              {copy.freeSiteCta}
            </PulsarActionLink>
          </div>
        </PulsarReveal>
      </div>
    </section>
  );
}
