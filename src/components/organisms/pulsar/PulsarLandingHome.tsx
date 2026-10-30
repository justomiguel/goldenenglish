import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarCompetitorComparisonSection } from "@/components/organisms/pulsar/PulsarCompetitorComparisonSection";
import { PulsarHomeProof } from "@/components/organisms/pulsar/PulsarHomeProof";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import type { PulsarClientSummary } from "@/components/organisms/pulsar/PulsarClientesView";

export interface PulsarLandingHomeProps {
  locale: string;
  dict: Dictionary;
  activeTenantCount: number;
  featuredClients?: readonly PulsarClientSummary[];
  email?: string | null;
}

const HERO_STILL_SRC = "/centrolisto/moments/sunday.webp";

export function PulsarLandingHome({
  locale,
  dict,
  activeTenantCount,
  featuredClients = [],
  email = null,
}: PulsarLandingHomeProps) {
  const copy = dict.pulsar.home;

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav="home">
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
          <h1 className="max-w-xl font-display text-4xl font-medium leading-[1.12] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-foreground)]">
            {copy.lead}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
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
          </div>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={HERO_STILL_SRC}
              alt={copy.heroImageAlt}
              fill
              priority
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover"
            />
          </figure>
        </div>
      </section>

      <PulsarHomeProof
        locale={locale}
        dict={dict}
        activeTenantCount={activeTenantCount}
        featuredClients={featuredClients}
      />
      <PulsarCompetitorComparisonSection dict={dict} />

      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.bottomCta.title}
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{copy.bottomCta.primaryCta}</span>
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
    </PulsarSiteChromeEntry>
  );
}
