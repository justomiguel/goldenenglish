import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, DoorOpen, Landmark, UserPlus, type LucideIcon } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { PulsarCompetitorComparisonSection } from "@/components/organisms/pulsar/PulsarCompetitorComparisonSection";
import { PulsarSiteChromeEntry } from "@/components/organisms/pulsar/PulsarSiteChromeEntry";

export interface PulsarProductoViewProps {
  locale: string;
  dict: Dictionary;
  email?: string | null;
}

const BAND_STILLS = [
  "/centrolisto/moments/sunday.webp",
  "/centrolisto/moments/class.webp",
  "/centrolisto/moments/family.webp",
  "/centrolisto/hero-desk.webp",
] as const;

const BAND_ICONS: readonly LucideIcon[] = [DoorOpen, UserPlus, BookOpen, Landmark];

export function PulsarProductoView({ locale, dict, email = null }: PulsarProductoViewProps) {
  const copy = dict.pulsar.product;
  const chapters = [
    {
      stageTitle: copy.stages.stage1,
      items: [copy.m1Title, copy.m2Title, copy.m3Title],
    },
    {
      stageTitle: copy.stages.stage2,
      items: [copy.m4Title, copy.m5Title, copy.m6Title],
    },
    {
      stageTitle: copy.stages.stage3,
      items: [copy.m7Title, copy.m8Title, copy.m11Title],
    },
    {
      stageTitle: copy.stages.stage4,
      items: [copy.m9Title, copy.m10Title, copy.m12Title],
    },
  ];

  return (
    <PulsarSiteChromeEntry locale={locale} dict={dict} email={email} activeNav="product">
      <section className="border-b border-[var(--color-border)] py-10 md:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="max-w-2xl font-display text-4xl font-medium tracking-tight text-[var(--color-foreground)] sm:text-5xl">
            {copy.title}
          </h1>
          <div className="mt-10 space-y-12">
            {chapters.map((chapter, index) => {
              const Icon = BAND_ICONS[index] ?? DoorOpen;
              const flipped = index % 2 === 1;
              return (
              <article key={chapter.stageTitle} className="grid items-center lg:grid-cols-12">
                <Image
                  src={BAND_STILLS[index] ?? BAND_STILLS[0]}
                  alt={chapter.stageTitle}
                  width={1280}
                  height={720}
                  priority={index === 0}
                  className={`aspect-[5/4] w-full object-cover lg:col-span-7 ${
                    flipped ? "lg:col-start-6" : ""
                  } ${index === 0 ? "" : "cl-moment"}`}
                />
                <div
                  className={`relative z-10 bg-[var(--color-background)] py-6 lg:col-span-6 ${
                    flipped ? "lg:col-start-1 lg:row-start-1 lg:-mr-[8%]" : "lg:-ml-[8%]"
                  }`}
                >
                  <Icon className="h-8 w-8 text-[var(--color-primary)]" aria-hidden />
                  <h2 className="mt-3 font-display text-2xl font-medium text-[var(--color-foreground)]">
                    {chapter.stageTitle}
                  </h2>
                  <ol className="mt-4 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                    {chapter.items.map((title) => (
                      <li key={title} className="py-3">
                        <h3 className="font-display text-lg font-medium text-[var(--color-foreground)]">
                          {title}
                        </h3>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <PulsarCompetitorComparisonSection dict={dict} />

      <section className="border-t border-[var(--color-border)] py-12">
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
    </PulsarSiteChromeEntry>
  );
}
