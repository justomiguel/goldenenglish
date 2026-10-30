import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import { GenericLandingContact } from "@/components/organisms/GenericLandingContact";

export interface GenericLandingCopy {
  name: string;
  scene: string;
  title: string;
  body: string;
  imageAlt: string;
  laterTitle: string;
  laterBody: string;
  cta: string;
}

const EXTRA_SECTIONS = ["historia", "oferta", "modalidades", "niveles", "certificaciones"] as const;

export interface LandingMainSectionsGenericProps {
  copy: GenericLandingCopy;
  locale: string;
  kind: GenericInstituteKind;
  /** CMS upload for Inicio. Stock art is the fallback. */
  heroSrc?: string;
  sectionSrc?: Partial<Record<(typeof EXTRA_SECTIONS)[number], string>>;
  sectionLabels?: Partial<Record<(typeof EXTRA_SECTIONS)[number], string>>;
  hiddenSections?: ReadonlySet<string>;
  contact?: { email: string; phone: string; address: string; whatsapp: string };
  contactLabels?: {
    email: string;
    phone: string;
    address: string;
    whatsapp: string;
  };
}

export function LandingMainSectionsGeneric({
  copy,
  locale,
  kind,
  heroSrc,
  sectionSrc,
  sectionLabels,
  hiddenSections,
  contact,
  contactLabels,
}: LandingMainSectionsGenericProps) {
  return (
    <article className="bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.scene}</p>
        <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {copy.body}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic */}
        <img
          src={heroSrc ?? genericSectionStockPath(kind, "inicio")}
          alt={copy.imageAlt}
          width={1200}
          height={640}
          className="mt-10 w-full rounded-[var(--layout-border-radius)]"
        />
        <section id="dia" className="mt-16 border-t border-[var(--color-border)] pt-12">
          <h2 className="text-2xl font-medium tracking-tight">{copy.laterTitle}</h2>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
            {copy.laterBody}
          </p>
          {EXTRA_SECTIONS.map((section) =>
            hiddenSections?.has(section) ? null : (
            <figure key={section} className="mt-12">
              <figcaption className="text-sm text-[var(--color-muted-foreground)]">
                {sectionLabels?.[section] ?? section}
              </figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic */}
              <img
                src={sectionSrc?.[section] ?? genericSectionStockPath(kind, section)}
                alt={sectionLabels?.[section] ?? section}
                width={1200}
                height={640}
                className="mt-3 w-full rounded-[var(--layout-border-radius)]"
              />
            </figure>
            ),
          )}
          <GenericLandingContact contact={contact} labels={contactLabels} />
          <Link
            href={`/${locale}/contact`}
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-[var(--color-primary)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
            {copy.cta}
          </Link>
        </section>
      </div>
    </article>
  );
}
