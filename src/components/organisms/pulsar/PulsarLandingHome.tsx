import Link from "next/link";
import { ArrowRight, Compass, Database, Smartphone, Sparkles } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
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
  const pillars = [
    { icon: Database, title: copy.pillar1Title, body: copy.pillar1Body },
    { icon: Smartphone, title: copy.pillar2Title, body: copy.pillar2Body },
    { icon: Sparkles, title: copy.pillar3Title, body: copy.pillar3Body },
  ];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="home">
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)] py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-bold tracking-widest text-[var(--color-primary)] uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.lead}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`/${locale}/contacto`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
              <span>{copy.primaryCta}</span>
            </Link>
            <Link
              href={`/${locale}/producto`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <Compass className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
              <span>{copy.secondaryCta}</span>
            </Link>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">
                {activeTenantCount}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-muted-foreground)]">
                {copy.stats.tenantsLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">
                {copy.stats.isolationValue}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-muted-foreground)]">
                {copy.stats.isolationLabel}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-6">
              <p className="text-3xl font-extrabold text-[var(--color-primary)]">
                {copy.stats.edgeValue}
              </p>
              <p className="mt-1 text-sm font-medium text-[var(--color-muted-foreground)]">
                {copy.stats.edgeLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
            {copy.pillarsTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-base text-[var(--color-muted-foreground)]">
            {copy.pillarsLead}
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-muted)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--color-foreground)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
