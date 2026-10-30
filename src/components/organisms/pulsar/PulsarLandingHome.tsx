import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { CentroListoGenerativeStage } from "@/components/organisms/pulsar/CentroListoLogoMark";
import { PulsarHomeFaq } from "@/components/organisms/pulsar/PulsarHomeFaq";
import { PulsarHomeProof } from "@/components/organisms/pulsar/PulsarHomeProof";
import { PulsarHomeStart } from "@/components/organisms/pulsar/PulsarHomeStart";
import { PulsarInteractivePortalShowcase } from "@/components/organisms/pulsar/PulsarInteractivePortalShowcase";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";
import type { PulsarClientSummary } from "@/components/organisms/pulsar/PulsarClientesView";

export interface PulsarLandingHomeProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
  featuredClients?: readonly PulsarClientSummary[];
}

const HERO_STILL_SRC = "/centrolisto/hero-desk.webp";

export function PulsarLandingHome({
  locale,
  dict,
  activeTenantCount,
  featuredClients = [],
}: PulsarLandingHomeProps) {
  const copy = dict.pulsar.home;
  const silences = [
    { n: "01", title: copy.pillar1Title, body: copy.pillar1Body },
    { n: "02", title: copy.pillar2Title, body: copy.pillar2Body },
    { n: "03", title: copy.pillar3Title, body: copy.pillar3Body },
  ];
  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="home">
      <section className="border-b border-[var(--color-border)] py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-medium leading-[1.15] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-foreground)]">
              {copy.craftsLine}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/contacto`}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
                <span>{copy.primaryCta}</span>
              </Link>
              <a
                href={dict.pulsar.contact.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
              >
                <MessageCircle className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <span>{copy.whatsappCta}</span>
              </a>
              <Link
                href={`/${locale}/producto`}
                className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
              >
                <Compass className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                <span>{copy.secondaryCta}</span>
              </Link>
            </div>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-muted-foreground)]">
              {copy.lead}
            </p>
            <div className="mt-8 max-w-sm">
              <CentroListoGenerativeStage
                compact
                noiseCaption={copy.generativeStage.noiseCaption}
                resolvedCaption={copy.generativeStage.resolvedCaption}
                replayLabel={copy.generativeStage.replayLabel}
                activeTenantsCount={activeTenantCount}
                tenantsLabel={copy.stats.tenantsLabel}
              />
            </div>
          </div>
          <div className="lg:col-span-6">
            <figure>
              <Image
                src={HERO_STILL_SRC}
                alt={copy.heroImageAlt}
                width={700}
                height={440}
                priority
                className="aspect-video w-full rounded-lg border border-[var(--color-border)] object-cover object-left-top"
              />
              <figcaption className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                {copy.heroImageCaption}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <p className="border-b border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-foreground)]">
        {copy.offerStrip}
      </p>

      <PulsarHomeProof
        locale={locale}
        dict={dict}
        activeTenantCount={activeTenantCount}
        featuredClients={featuredClients}
      />
      <PulsarHomeStart dict={dict} />
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

      <PulsarHomeFaq dict={dict} />

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
          <p className="mt-10 max-w-xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.freeSiteNote}
          </p>
          <Link
            href={`/${locale}/cuenta/registro`}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:text-[var(--color-primary)]"
          >
            <ArrowRight className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>{copy.freeSiteCta}</span>
          </Link>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
