import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { CentroListoGenerativeStage } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarInteractivePortalShowcase } from "@/components/organisms/pulsar/PulsarInteractivePortalShowcase";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarLandingHomeProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
}

export function PulsarLandingHome({
  locale,
  dict,
  activeTenantCount,
}: PulsarLandingHomeProps) {
  const copy = dict.pulsar.home;
  const silences = [
    { n: "01", title: copy.pillar1Title, body: copy.pillar1Body },
    { n: "02", title: copy.pillar2Title, body: copy.pillar2Body },
    { n: "03", title: copy.pillar3Title, body: copy.pillar3Body },
  ];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="home">
      <section className="border-b border-[var(--color-border)] py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-xl font-display text-4xl font-medium leading-[1.15] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-muted-foreground)] sm:text-lg">
              {copy.lead}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
                <span>{copy.primaryCta}</span>
              </Link>
              <Link
                href={`/${locale}/producto`}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
              >
                <Compass className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <span>{copy.secondaryCta}</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <CentroListoGenerativeStage
              noiseCaption={copy.generativeStage.noiseCaption}
              resolvedCaption={copy.generativeStage.resolvedCaption}
              replayLabel={copy.generativeStage.replayLabel}
              activeTenantsCount={activeTenantCount}
              tenantsLabel={copy.stats.tenantsLabel}
            />
          </div>
        </div>
      </section>

      <PulsarInteractivePortalShowcase dict={dict} />

      <section className="border-b border-[var(--color-border)] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.pillarsTitle}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.pillarsLead}
          </p>
          <ol className="mt-14 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {silences.map((item) => (
              <li key={item.n} className="grid gap-4 py-8 md:grid-cols-12 md:gap-8">
                <p className="font-display text-sm text-[var(--color-accent)] md:col-span-2">
                  {item.n}
                </p>
                <div className="md:col-span-10">
                  <h3 className="font-display text-xl font-medium text-[var(--color-foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.bottomCta.title}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.bottomCta.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{copy.bottomCta.primaryCta}</span>
            </Link>
            <Link
              href={`/${locale}/producto`}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
            >
              <Compass className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <span>{copy.bottomCta.secondaryCta}</span>
            </Link>
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
