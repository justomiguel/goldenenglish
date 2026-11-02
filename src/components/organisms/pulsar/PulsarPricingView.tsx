import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarOfferPrice } from "@/components/organisms/pulsar/PulsarOfferPrice";
import { PulsarOfferMatrix } from "@/components/organisms/pulsar/PulsarOfferMatrix";
import { PulsarReveal } from "@/components/organisms/pulsar/PulsarReveal";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { pulsarStartFreePath } from "@/lib/pulsar/pulsarStartPath";
import {
  formatOfferAmount,
  publishedSetupOffer,
} from "@/lib/pulsar/centrolistoCommercialOffer";
import { PULSAR_SOLUTION_SLUGS, type PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarPricingViewProps {
  locale: string;
  dict: Dictionary;
  email?: string | null;
  market?: CentrolistoMarketCode;
}

const STILL: Record<PulsarSolutionSlug, string> = {
  presencia: "/centrolisto/product/public-site.jpg",
  gestion: "/centrolisto/product/admin-hub.jpg",
  ecosistema: "/centrolisto/marketing/ecosistema-editorial.jpg",
};

function stillAlt(dict: Dictionary, slug: PulsarSolutionSlug): string {
  if (slug === "presencia") return dict.pulsar.solutions.publicSiteAlt;
  if (slug === "gestion") return dict.pulsar.solutions.adminAlt;
  return dict.pulsar.solutionSet.ecosistema.imageAlt;
}

function setupLabel(
  market: CentrolistoMarketCode,
  copy: Dictionary["pulsar"]["pricing"],
  id: string,
): string {
  const row = publishedSetupOffer(id, market);
  if (!row || row.status !== "published") return "";
  if (row.kind === "quote" || row.amount === null) return copy.quoteLabel;
  if (row.amount === 0) return copy.free;
  return `${formatOfferAmount(row.amount, market)} ${copy.oneTimeTax}`;
}

export function PulsarPricingView({ locale, dict, email = null, market = "cl" }: PulsarPricingViewProps) {
  const copy = dict.pulsar.pricing;

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} market={market} activeNav="pricing">
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
          <h1 className="font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)] md:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-muted-foreground)]">{copy.lead}</p>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-16 px-4 sm:px-6">
          {PULSAR_SOLUTION_SLUGS.map((slug, index) => {
            const item = dict.pulsar.solutionSet[slug];
            return (
              <article key={slug} className={`${styles.pricePanel} grid items-center gap-8 lg:grid-cols-2 lg:gap-14`}>
                <PulsarReveal from={index === 1 ? "depth" : index === 2 ? "right" : "left"} delay={index * 120}>
                  <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]">
                    <Image src={STILL[slug]} alt={stillAlt(dict, slug)} fill sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover object-top" />
                  </figure>
                </PulsarReveal>
                <div>
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{item.navLabel}</p>
                  <PulsarOfferPrice dict={dict} slug={slug} market={market} />
                  <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{item.headline}</h2>
                  <p className="mt-3 text-base leading-relaxed text-[var(--color-foreground)]">{item.lead}</p>
                  <ul className="mt-5 space-y-2">
                    {copy.features[slug].map((line) => (
                      <li key={line} className="text-sm text-[var(--color-muted-foreground)]">{line}</li>
                    ))}
                  </ul>
                  {slug === "presencia" ? (
                    <p className="mt-5 text-sm font-medium text-[var(--color-foreground)]">{copy.templateRule}</p>
                  ) : null}
                  <div className="mt-6 flex flex-col items-start gap-3">
                    <PulsarActionLink
                      href={withCentrolistoMarket(
                        slug === "presencia" ? `/${locale}/cuenta/registro` : `/${locale}/contacto?interes=${slug}`,
                        market,
                      )}
                      tone={slug === "presencia" ? "primary" : "quiet"}
                      eventName={slug === "presencia" ? "cl_create_free_page" : slug === "gestion" ? "cl_demo_gestion" : "cl_demo_ecosistema"}
                    >
                      {item.cta}
                    </PulsarActionLink>
                    {slug === "presencia" ? (
                      <PulsarActionLink href={withCentrolistoMarket(`/${locale}/contacto?interes=medida`, market)} tone="quiet" eventName="cl_quote_custom">{copy.customCta}</PulsarActionLink>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.customTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)]">{copy.customBody}</p>
          <div className="mt-6">
            <PulsarActionLink href={withCentrolistoMarket(`/${locale}/contacto?interes=medida`, market)} tone="quiet" eventName="cl_quote_custom">{copy.customCta}</PulsarActionLink>
          </div>
        </div>
      </section>

      <PulsarOfferMatrix dict={dict} />

      <section className="border-b border-[var(--color-border)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.setupTitle}</h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted-foreground)]">{copy.setupLead}</p>
          <ul className="mt-8 divide-y divide-[var(--color-border)]">
            {copy.setupRows.map((row) => (
              <li key={row.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-sm text-[var(--color-foreground)]">{row.label}</span>
                <span className="text-sm font-medium text-[var(--color-foreground)]">{setupLabel(market, copy, row.id)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.faqTitle}</h2>
          <div className="mt-8 space-y-8">
            {copy.faqs.map((item) => (
              <article key={item.q}>
                <h3 className="font-display text-xl font-medium text-[var(--color-foreground)]">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{copy.closeTitle}</h2>
          <PulsarActionLink href={withCentrolistoMarket(pulsarStartFreePath(locale, Boolean(email)), market)} tone="primary">{dict.pulsar.nav.startFree}</PulsarActionLink>
        </div>
      </section>
    </PulsarSiteChromeEntry>
  );
}
