"use client";

import { useState } from "react";
import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { GENERIC_INSTITUTE_KINDS, genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { formatOfferAmount, customLandingAmount } from "@/lib/pulsar/centrolistoCommercialOffer";

export interface PulsarPresenciaStartProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarPresenciaStart({ locale, dict, market = "cl" }: PulsarPresenciaStartProps) {
  const item = dict.pulsar.solutionSet.presencia;
  const pricing = dict.pulsar.pricing;
  const [kind, setKind] = useState<(typeof GENERIC_INSTITUTE_KINDS)[number]>("idiomas");
  const amount = `${formatOfferAmount(customLandingAmount(market), market)} ${pricing.oneTimeTax}`;

  return (
    <section id="gratis" className="border-b border-[var(--color-border)] py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {item.templatePickerTitle}
        </h2>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-6">
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{pricing.free}</p>
            <h3 className="mt-2 font-display text-2xl font-medium text-[var(--color-foreground)]">{item.templateFreeTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-foreground)]">{item.templateFreeBody}</p>
            <div className="mt-6">
              <PulsarActionLink href={withCentrolistoMarket(`/${locale}/cuenta/registro`, market)} tone="primary" eventName="cl_create_free_page">
                {item.cta}
              </PulsarActionLink>
            </div>
          </article>
          <article className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-6">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{amount}</p>
            <h3 className="mt-2 font-display text-2xl font-medium text-[var(--color-foreground)]">{item.templateCustomTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-foreground)]">{item.templateCustomBody}</p>
            <div className="mt-6">
              <PulsarActionLink href={withCentrolistoMarket(`/${locale}/contacto?interes=medida`, market)} tone="quiet" eventName="cl_quote_custom">
                {pricing.customCta}
              </PulsarActionLink>
            </div>
          </article>
        </div>
        <h3 className="mt-14 font-display text-2xl font-medium text-[var(--color-foreground)]">{item.templateGalleryTitle}</h3>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label={item.templateGalleryTitle}>
          {GENERIC_INSTITUTE_KINDS.map((entry) => (
            <button
              key={entry}
              type="button"
              role="tab"
              aria-selected={entry === kind}
              data-cl-event="cl_template_preview"
              data-cl-detail={entry}
              className={`min-h-11 rounded-[var(--layout-border-radius)] border px-4 text-sm font-medium ${
                entry === kind
                  ? "border-[var(--color-foreground)] bg-[var(--color-surface)] text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              }`}
              onClick={() => setKind(entry)}
            >
              {item.templateKinds[entry]}
            </button>
          ))}
        </div>
        <figure className="relative mt-6 aspect-[16/9] overflow-hidden rounded-[var(--layout-border-radius)]">
          <Image
            src={genericSectionStockPath(kind, "inicio")}
            alt={item.templateKinds[kind]}
            fill
            sizes="(min-width: 1024px) 72rem, 100vw"
            className="object-cover object-top"
          />
        </figure>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">{dict.pulsar.home.freeSiteNote}</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">{dict.pulsar.account.registerLead}</p>
      </div>
    </section>
  );
}
