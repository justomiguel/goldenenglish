import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { JsonLdFaqPage } from "@/components/molecules/JsonLdFaqPage";
import { PulsarActionLink } from "@/components/organisms/pulsar/PulsarActionLink";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";
import { PULSAR_SEGMENT_SLUGS, type PulsarSegmentSlug } from "@/lib/pulsar/pulsarSegmentSlugs";

export interface PulsarSegmentViewProps {
  locale: string;
  dict: Dictionary;
  segment: PulsarSegmentSlug;
  email?: string | null;
}

const STILLS: Record<PulsarSegmentSlug, string> = {
  danza: "/centrolisto/moments/class.webp",
  musica: "/centrolisto/moments/family.webp",
  idiomas: "/centrolisto/moments/sunday.webp",
  deportes: "/centrolisto/hero-desk.webp",
  eventos: "/centrolisto/moments/class.webp",
};

export function PulsarSegmentView({ locale, dict, segment, email = null }: PulsarSegmentViewProps) {
  const copy = dict.pulsar.segments[segment];
  const voice = segment === "musica" ? dict.pulsar.clients.voices[0] : null;
  const others = PULSAR_SEGMENT_SLUGS.filter((slug) => slug !== segment);

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav="home">
      <JsonLdFaqPage items={copy.faqs} />
      <section className="border-b border-[var(--color-border)]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 className="max-w-xl font-display text-4xl font-medium leading-[1.08] tracking-tight text-[var(--color-foreground)] sm:text-5xl">
              {copy.h1}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--color-foreground)]">{copy.lead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PulsarActionLink href={`/${locale}/contacto`} tone="primary">
                {copy.cta}
              </PulsarActionLink>
              <PulsarActionLink href={`/${locale}/cuenta/registro`} tone="quiet">
                {dict.pulsar.home.freeSiteCta}
              </PulsarActionLink>
            </div>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {dict.pulsar.home.freeSiteNote}
            </p>
          </div>
          <figure className="relative aspect-[4/3] overflow-hidden">
            <Image src={STILLS[segment]} alt={copy.imageAlt} fill sizes="(min-width: 1024px) 36rem, 100vw" className="object-cover" />
          </figure>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-medium text-[var(--color-foreground)]">{copy.problemsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {copy.problems.map((item) => (
                <li key={item} className="border-t border-[var(--color-border)] pt-3 text-base text-[var(--color-foreground)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl font-medium text-[var(--color-foreground)]">{copy.benefitsTitle}</h2>
            <ul className="mt-6 space-y-3">
              {copy.benefits.map((item) => (
                <li key={item} className="border-t border-[var(--color-border)] pt-3 text-base text-[var(--color-foreground)]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-border)] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium text-[var(--color-foreground)]">{copy.featuresTitle}</h2>
          <ul className="mt-6 max-w-2xl space-y-3">
            {copy.features.map((item) => (
              <li key={item} className="text-base leading-relaxed text-[var(--color-foreground)]">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8">
            <Link
              href={`/${locale}/producto`}
              className="text-sm font-medium text-[var(--color-foreground)] underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-foreground)]"
            >
              {dict.pulsar.nav.product}
            </Link>
          </p>
        </div>
      </section>

      {voice ? (
        <section className="border-b border-[var(--color-border)] py-14">
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 sm:px-6 sm:grid-cols-[7.5rem_1fr]">
            <figure className="relative aspect-[3/4] w-full max-w-[7.5rem] overflow-hidden">
              <Image src="/centrolisto/voices/camila.jpg" alt="" fill sizes="120px" className="object-cover" />
            </figure>
            <blockquote>
              <p className="font-display text-2xl font-medium leading-snug text-[var(--color-foreground)]">{voice.quote}</p>
              <footer className="mt-4 text-sm text-[var(--color-muted-foreground)]">
                {voice.name} · {voice.role}
              </footer>
            </blockquote>
          </div>
        </section>
      ) : null}

      <section className="border-b border-[var(--color-border)] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-medium text-[var(--color-foreground)]">{copy.faqTitle}</h2>
          <div className="mt-6 max-w-2xl space-y-6">
            {copy.faqs.map((item) => (
              <article key={item.q}>
                <h3 className="text-base font-medium text-[var(--color-foreground)]">{item.q}</h3>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <PulsarActionLink href={`/${locale}/contacto`} tone="primary">
            {copy.cta}
          </PulsarActionLink>
          <p className="mt-10 text-sm font-medium text-[var(--color-foreground)]">{copy.alsoLabel}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {others.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/${locale}/para/${slug}`}
                  className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                >
                  {dict.pulsar.segments[slug].navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PulsarSiteChromeEntry>
  );
}
