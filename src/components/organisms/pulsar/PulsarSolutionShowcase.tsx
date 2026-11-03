import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarOfferPrice } from "@/components/organisms/pulsar/PulsarOfferPrice";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";
import { PulsarReveal } from "@/components/organisms/pulsar/PulsarReveal";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { PULSAR_SOLUTION_SLUGS, type PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarSolutionShowcaseProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

const FROM = {
  presencia: "left",
  gestion: "depth",
  ecosistema: "right",
} as const;

const DELAY = [0, 120, 240] as const;

function buttonHref(locale: string, slug: PulsarSolutionSlug, market: CentrolistoMarketCode): string {
  if (slug === "presencia") return withCentrolistoMarket(`/${locale}/cuenta/registro`, market);
  return withCentrolistoMarket(`/${locale}/contacto?interes=${slug}`, market);
}

const EVENT: Record<PulsarSolutionSlug, string> = {
  presencia: "cl_create_free_page",
  gestion: "cl_demo_gestion",
  ecosistema: "cl_demo_ecosistema",
};

const STAGE_SRC: Record<PulsarSolutionSlug, string> = {
  presencia: "/centrolisto/product/public-site.jpg",
  gestion: "/centrolisto/product/admin-hub.jpg",
  ecosistema: "/centrolisto/product/public-site.jpg",
};

export function PulsarSolutionShowcase({ locale, dict, market = "cl" }: PulsarSolutionShowcaseProps) {
  const copy = dict.pulsar.solutions;
  const pricing = dict.pulsar.pricing;

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
          {copy.sectionTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted-foreground)]">{copy.sectionLead}</p>
        <div className="mt-4">
          <Link href={withCentrolistoMarket(`/${locale}/precios`, market)} className="text-sm font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline">
            {pricing.seePrices}
          </Link>
        </div>
        <div className="mt-14 space-y-20">
          {PULSAR_SOLUTION_SLUGS.map((slug, index) => {
            const item = dict.pulsar.solutionSet[slug];
            const landing = withCentrolistoMarket(`/${locale}/soluciones/${slug}`, market);
            return (
              <article key={slug} className={`${styles.pricePanel} grid items-center gap-8 lg:grid-cols-2 lg:gap-14`}>
                <PulsarReveal from={FROM[slug]} delay={DELAY[index]} className={slug === "gestion" ? "lg:order-2" : undefined}>
                  <Link href={landing} className={`${styles.frameShift} block`}>
                    <PulsarBrowserShot
                      src={STAGE_SRC[slug]}
                      alt={slug === "gestion" ? copy.adminAlt : copy.publicSiteAlt}
                    />
                    {slug === "ecosistema" ? (
                      <div className="mt-4 max-w-[16rem]">
                        <PulsarBrowserShot src="/centrolisto/product/admin-hub.jpg" alt={copy.adminAlt} />
                      </div>
                    ) : null}
                  </Link>
                </PulsarReveal>
                <div className={slug === "gestion" ? "lg:order-1" : undefined}>
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{item.navLabel}</p>
                  <PulsarOfferPrice dict={dict} slug={slug} market={market} />
                  <h3 className="mt-4 font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
                    <Link href={landing} className="transition-colors hover:text-[var(--color-primary)]">
                      {item.headline}
                    </Link>
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--color-foreground)]">{item.lead}</p>
                  <ul className="mt-5 space-y-2">
                    {item.benefits.slice(0, 3).map((benefit) => (
                      <li key={benefit} className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {slug === "presencia" ? (
                    <p className="mt-5 text-sm font-medium text-[var(--color-foreground)]">{pricing.templateRule}</p>
                  ) : null}
                  <div className="mt-6 flex flex-col items-start gap-3">
                    <PulsarActionLink href={buttonHref(locale, slug, market)} tone={slug === "presencia" ? "primary" : "quiet"} eventName={EVENT[slug]}>
                      {item.cta}
                    </PulsarActionLink>
                    {slug === "presencia" ? (
                      <PulsarActionLink href={withCentrolistoMarket(`/${locale}/contacto?interes=medida`, market)} tone="quiet" eventName="cl_quote_custom">
                        {pricing.customCta}
                      </PulsarActionLink>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
