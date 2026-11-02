import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarHeroStage } from "@/components/organisms/pulsar/PulsarHeroStage";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export interface PulsarHomeHeroProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarHomeHero({ locale, dict, market = "cl" }: PulsarHomeHeroProps) {
  const copy = dict.pulsar.home;
  const lines = copy.title.split(/(?<=\.)\s+/).filter(Boolean);
  const explore = `/${locale}#plataforma`;
  const demo = withCentrolistoMarket(`/${locale}/contacto?interes=unsure`, market);
  const free = withCentrolistoMarket(`/${locale}/cuenta/registro`, market);
  const plan = withCentrolistoMarket(`/${locale}/soluciones/presencia#gratis`, market);

  return (
    <section className="border-b border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className={`${styles.heroLine} text-sm font-medium text-[var(--color-muted-foreground)]`} style={{ animationDelay: "40ms" }}>
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {lines.map((line, index) => (
              <span key={line} className={`${styles.heroLine} block`} style={{ animationDelay: `${140 + index * 110}ms` }}>
                {line}{" "}
              </span>
            ))}
          </h1>
          <p className={`${styles.heroLine} mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-foreground)]`} style={{ animationDelay: "520ms" }}>
            {copy.lead}
          </p>
          <div className={`${styles.heroLine} mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap`} style={{ animationDelay: "980ms" }}>
            <PulsarActionLink href={explore} tone="primary" eventName="cl_explore_platform">
              {copy.primaryCta}
            </PulsarActionLink>
            <PulsarActionLink href={demo} tone="quiet" eventName="cl_demo_request">
              {copy.demoCta}
            </PulsarActionLink>
            <PulsarActionLink href={free} tone="quiet" eventName="cl_create_free_page">
              {copy.freeSiteCta}
            </PulsarActionLink>
          </div>
          <p className={`${styles.heroLine} mt-4 max-w-lg text-sm text-[var(--color-muted-foreground)]`} style={{ animationDelay: "1100ms" }}>
            {copy.freeSiteNote}{" "}
            <a href={plan} className="font-medium text-[var(--color-foreground)] underline-offset-4 hover:underline">
              {copy.freePlanLink}
            </a>
          </p>
        </div>
        <PulsarHeroStage editorialAlt={copy.heroImageAlt} dashboardAlt={copy.heroDashboardAlt} siteAlt={copy.heroSiteAlt} />
      </div>
    </section>
  );
}
