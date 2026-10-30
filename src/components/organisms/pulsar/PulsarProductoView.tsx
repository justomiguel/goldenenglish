import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarCompetitorComparisonSection } from "@/components/organisms/pulsar/PulsarCompetitorComparisonSection";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

export interface PulsarProductoViewProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarProductoView({ locale, dict }: PulsarProductoViewProps) {
  const copy = dict.pulsar.product;
  const chapters = [
    {
      stageTitle: copy.stages.stage1,
      items: [
        { n: "01", title: copy.m1Title, body: copy.m1Body },
        { n: "02", title: copy.m2Title, body: copy.m2Body },
        { n: "03", title: copy.m3Title, body: copy.m3Body },
      ],
    },
    {
      stageTitle: copy.stages.stage2,
      items: [
        { n: "04", title: copy.m4Title, body: copy.m4Body },
        { n: "05", title: copy.m5Title, body: copy.m5Body },
        { n: "06", title: copy.m6Title, body: copy.m6Body },
      ],
    },
    {
      stageTitle: copy.stages.stage3,
      items: [
        { n: "07", title: copy.m7Title, body: copy.m7Body },
        { n: "08", title: copy.m8Title, body: copy.m8Body },
        { n: "09", title: copy.m11Title, body: copy.m11Body },
      ],
    },
    {
      stageTitle: copy.stages.stage4,
      items: [
        { n: "10", title: copy.m9Title, body: copy.m9Body },
        { n: "11", title: copy.m10Title, body: copy.m10Body },
        { n: "12", title: copy.m12Title, body: copy.m12Body },
      ],
    },
  ];

  return (
    <PulsarSiteChrome locale={locale} dict={dict} activeNav="product">
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.lead}
          </p>

          <div className="mt-16 space-y-16">
            {chapters.map((chapter) => (
              <div key={chapter.stageTitle}>
                <h2 className="font-display text-lg text-[var(--color-primary)]">
                  {chapter.stageTitle}
                </h2>
                <ol className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                  {chapter.items.map((item) => (
                    <li key={item.n} className="grid gap-3 py-6 md:grid-cols-12 md:gap-8">
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
            ))}
          </div>
        </div>
      </section>

      <PulsarCompetitorComparisonSection dict={dict} />

      <section className="border-t border-[var(--color-border)] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link
            href={`/${locale}/contacto`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span>{dict.pulsar.nav.cta}</span>
          </Link>
        </div>
      </section>
    </PulsarSiteChrome>
  );
}
