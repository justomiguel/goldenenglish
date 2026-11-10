import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

export interface PulsarHomeHeroProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
  market?: CentrolistoMarketCode;
}

export function PulsarHomeHero({ locale, dict, activeTenantCount, market = "cl" }: PulsarHomeHeroProps) {
  const copy = dict.pulsar.home;
  const free = withCentrolistoMarket(`/${locale}/cuenta/registro`, market);

  return (
    <section className="relative min-h-[100dvh]">
      <Image
        src="/centrolisto/clients/espaciozenit.jpg"
        alt={copy.house.siteAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[color-mix(in_srgb,var(--color-background)_78%,transparent)] to-transparent" />
      <div className={`${styles.houseEnter} relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col justify-end px-4 pb-28 sm:px-6 lg:justify-center lg:pb-16`}>
        <h1 className="max-w-xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-lg text-lg text-[var(--color-foreground)]">
          {copy.house.fact.replace("{count}", String(activeTenantCount))}
        </p>
        <div className="mt-8">
          <PulsarActionLink href={free} tone="primary" eventName="cl_create_free_page">
            {copy.freeSiteCta}
          </PulsarActionLink>
        </div>
      </div>
    </section>
  );
}
