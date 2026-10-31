import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarOfferPrice } from "@/components/organisms/pulsar/PulsarOfferPrice";
import { PulsarProductVideo } from "@/components/organisms/pulsar/PulsarProductVideo";
import { PulsarReveal } from "@/components/organisms/pulsar/PulsarReveal";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { PULSAR_SOLUTION_SLUGS, type PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarSolutionShowcaseProps {
  locale: string;
  dict: Dictionary;
}

const STAGE = "relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]";

const FROM = {
  presencia: "left",
  gestion: "depth",
  ecosistema: "right",
} as const;

const DELAY = [0, 120, 240] as const;

function buttonHref(locale: string, slug: PulsarSolutionSlug): string {
  if (slug === "presencia") return `/${locale}/cuenta/registro`;
  return `/${locale}/contacto`;
}

export function PulsarSolutionShowcase({ locale, dict }: PulsarSolutionShowcaseProps) {
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
          <Link href={`/${locale}/precios`} className="text-sm font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline">
            {pricing.seePrices}
          </Link>
        </div>
        <div className="mt-14 space-y-20">
          {PULSAR_SOLUTION_SLUGS.map((slug, index) => {
            const item = dict.pulsar.solutionSet[slug];
            const landing = `/${locale}/soluciones/${slug}`;
            return (
              <article key={slug} className={`${styles.pricePanel} grid items-center gap-8 lg:grid-cols-2 lg:gap-14`}>
                <PulsarReveal from={FROM[slug]} delay={DELAY[index]} className={slug === "gestion" ? "lg:order-2" : undefined}>
                  <Link href={landing} className="block">
                    <figure className={`${styles.frameShift} ${STAGE}`}>
                      {slug === "gestion" ? (
                        <PulsarProductVideo
                          src="/videos/centrolisto/flow-2-desktop.webm"
                          poster="/centrolisto/product/admin-hub.jpg"
                          label={copy.adminAlt}
                          className="absolute inset-0 h-full w-full object-cover object-top"
                        />
                      ) : (
                        <Image
                          src={
                            slug === "presencia"
                              ? "/centrolisto/product/public-site.jpg"
                              : "/centrolisto/marketing/ecosistema-editorial.jpg"
                          }
                          alt={slug === "presencia" ? copy.publicSiteAlt : item.imageAlt}
                          fill
                          sizes="(min-width: 1024px) 36rem, 100vw"
                          className={slug === "presencia" ? "object-cover object-top" : "object-cover"}
                        />
                      )}
                    </figure>
                  </Link>
                </PulsarReveal>
                <div className={slug === "gestion" ? "lg:order-1" : undefined}>
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{item.navLabel}</p>
                  <PulsarOfferPrice locale={locale} dict={dict} slug={slug} />
                  <h3 className="mt-4 font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
                    <Link href={landing} className="transition-colors hover:text-[var(--color-primary)]">
                      {item.headline}
                    </Link>
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[var(--color-foreground)]">{item.lead}</p>
                  <ul className="mt-5 space-y-2">
                    {item.benefits.map((benefit) => (
                      <li key={benefit} className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  {slug === "presencia" ? (
                    <p className="mt-5 text-sm font-medium text-[var(--color-foreground)]">{pricing.templateRule}</p>
                  ) : null}
                  <div className="mt-6 flex flex-col items-start gap-3">
                    <PulsarActionLink href={buttonHref(locale, slug)} tone={slug === "presencia" ? "primary" : "quiet"}>
                      {item.cta}
                    </PulsarActionLink>
                    {slug === "presencia" ? (
                      <PulsarActionLink href={`/${locale}/contacto`} tone="quiet">
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
