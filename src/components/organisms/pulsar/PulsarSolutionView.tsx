import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarCompetitorComparisonSection } from "@/components/organisms/pulsar/PulsarCompetitorComparisonSection";
import { PulsarHomeFaq } from "@/components/organisms/pulsar/PulsarHomeFaq";
import { PulsarHomePlatform } from "@/components/organisms/pulsar/PulsarHomePlatform";
import { PulsarHomeProblem } from "@/components/organisms/pulsar/PulsarHomeProblem";
import { PulsarOfferPrice } from "@/components/organisms/pulsar/PulsarOfferPrice";
import { PulsarProductVideo } from "@/components/organisms/pulsar/PulsarProductVideo";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import { PULSAR_SOLUTION_SLUGS, type PulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarSolutionViewProps {
  locale: string;
  dict: Dictionary;
  solution: PulsarSolutionSlug;
  email?: string | null;
}

const PHOTO: Record<PulsarSolutionSlug, string> = {
  presencia: "/centrolisto/marketing/presencia-editorial.jpg",
  gestion: "/centrolisto/marketing/gestion-editorial.jpg",
  ecosistema: "/centrolisto/marketing/ecosistema-editorial.jpg",
};

const VOICE_INDEX: Partial<Record<PulsarSolutionSlug, readonly number[]>> = {
  gestion: [2, 3],
  ecosistema: [1, 4],
};

const PORTRAITS = [
  "/centrolisto/voices/camila.jpg",
  "/centrolisto/voices/mateo.jpg",
  "/centrolisto/voices/andrea-office.jpg",
  "/centrolisto/voices/rodrigo.jpg",
  "/centrolisto/voices/sofia.jpg",
  "/centrolisto/voices/luis.jpg",
] as const;

export function PulsarSolutionView({ locale, dict, solution, email = null }: PulsarSolutionViewProps) {
  const item = dict.pulsar.solutionSet[solution];
  const voices = (VOICE_INDEX[solution] ?? []).flatMap((index) => {
    const voice = dict.pulsar.clients.voices[index];
    return voice ? [{ voice, index }] : [];
  });

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav={solution}>
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">{item.tagline}</p>
            <PulsarOfferPrice locale={locale} dict={dict} slug={solution} />
            <h1 className="mt-3 font-display text-4xl font-medium leading-[1.08] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              {item.headline}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-foreground)]">{item.lead}</p>
            <ul className="mt-6 space-y-2">
              {item.benefits.map((benefit) => (
                <li key={benefit} className="text-sm text-[var(--color-muted-foreground)]">
                  {benefit}
                </li>
              ))}
            </ul>
            {solution === "presencia" ? (
              <p className="mt-5 max-w-lg text-sm font-medium text-[var(--color-foreground)]">
                {dict.pulsar.pricing.templateRule}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {solution === "presencia" ? (
                <PulsarActionLink href={`/${locale}/cuenta/registro`} tone="primary">
                  {item.cta}
                </PulsarActionLink>
              ) : (
                <PulsarActionLink href={`/${locale}/contacto`} tone="primary">
                  {item.cta}
                </PulsarActionLink>
              )}
              {solution === "presencia" ? (
                <PulsarActionLink href={`/${locale}/contacto`} tone="quiet">
                  {dict.pulsar.pricing.customCta}
                </PulsarActionLink>
              ) : (
                <PulsarActionLink href={`/${locale}/producto`} tone="quiet">
                  {dict.pulsar.nav.product}
                </PulsarActionLink>
              )}
            </div>
            {solution === "presencia" ? (
              <>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-[var(--color-foreground)]">
                  {dict.pulsar.pricing.customTitle}
                </p>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {dict.pulsar.pricing.customBody}
                </p>
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                  {dict.pulsar.home.freeSiteNote}
                </p>
              </>
            ) : null}
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]">
            {solution === "gestion" ? (
              <PulsarProductVideo
                src="/videos/centrolisto/flow-2-desktop.webm"
                poster="/centrolisto/product/admin-hub.jpg"
                label={dict.pulsar.solutions.adminAlt}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            ) : solution === "presencia" ? (
              <Image
                src="/centrolisto/product/public-site.jpg"
                alt={dict.pulsar.solutions.publicSiteAlt}
                fill
                sizes="(min-width: 1024px) 36rem, 100vw"
                className="object-cover object-top"
              />
            ) : (
              <Image
                src={PHOTO[solution]}
                alt={item.imageAlt}
                fill
                sizes="(min-width: 1024px) 36rem, 100vw"
                className="object-cover"
              />
            )}
          </figure>
        </div>
      </section>

      {voices.length > 0 ? (
        <section className="border-b border-[var(--color-border)] py-14">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-2">
            {voices.map(({ voice, index }) => (
              <article key={voice.name} className="flex gap-4">
                <figure className="relative h-16 w-16 shrink-0 overflow-hidden">
                  <Image src={PORTRAITS[index] ?? PORTRAITS[0]} alt="" fill sizes="64px" className="object-cover" />
                </figure>
                <div>
                  <p className="font-display text-xl font-medium leading-snug text-[var(--color-foreground)]">{voice.quote}</p>
                  <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
                    {voice.name} · {voice.role}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {solution === "gestion" ? (
        <>
          <PulsarHomeProblem dict={dict} />
          <PulsarHomeFaq dict={dict} />
          <PulsarCompetitorComparisonSection dict={dict} />
        </>
      ) : null}
      {solution === "ecosistema" ? <PulsarHomePlatform dict={dict} /> : null}

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="flex flex-col gap-2">
            <li>
              <Link
                href={`/${locale}/precios`}
                className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {dict.pulsar.nav.pricing}
              </Link>
            </li>
            {PULSAR_SOLUTION_SLUGS.filter((slug) => slug !== solution).map((slug) => (
              <li key={slug}>
                <Link
                  href={`/${locale}/soluciones/${slug}`}
                  className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  {dict.pulsar.solutionSet[slug].navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PulsarSiteChromeEntry>
  );
}
