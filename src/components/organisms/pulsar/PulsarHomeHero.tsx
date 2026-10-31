import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeHeroProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarHomeHero({ locale, dict }: PulsarHomeHeroProps) {
  const copy = dict.pulsar.home;
  const lines = copy.title.split(/(?<=\.)\s+/).filter(Boolean);

  return (
    <section className="border-b border-[var(--color-border)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div>
          <p className={`${styles.heroLine} text-sm font-medium text-[var(--color-muted-foreground)]`} style={{ animationDelay: "40ms" }}>
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 max-w-xl font-display text-4xl font-medium leading-[1.05] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {lines.map((line, index) => (
              <span
                key={line}
                className={`${styles.heroLine} block`}
                style={{ animationDelay: `${140 + index * 110}ms` }}
              >
                {line}{" "}
              </span>
            ))}
          </h1>
          <p
            className={`${styles.heroLine} mt-6 max-w-lg text-lg leading-relaxed text-[var(--color-foreground)]`}
            style={{ animationDelay: "520ms" }}
          >
            {copy.lead}
          </p>
          <div className={`${styles.heroLine} mt-8 flex flex-col gap-3 sm:flex-row`} style={{ animationDelay: "980ms" }}>
            <PulsarActionLink href={`/${locale}/contacto`} tone="primary">
              {copy.primaryCta}
            </PulsarActionLink>
            <PulsarActionLink href={`/${locale}/cuenta/registro`} tone="quiet">
              {copy.freeSiteCta}
            </PulsarActionLink>
          </div>
          <p className={`${styles.heroLine} mt-4 text-sm text-[var(--color-muted-foreground)]`} style={{ animationDelay: "1100ms" }}>
            {copy.freeSiteNote}
          </p>
        </div>
        <figure
          className={`${styles.heroDepth} relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]`}
          style={{ animationDelay: "640ms" }}
        >
          <Image
            src="/centrolisto/marketing/hero-editorial.jpg"
            alt={copy.heroImageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
        </figure>
      </div>
    </section>
  );
}
