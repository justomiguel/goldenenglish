import type { GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { genericSectionStockPath } from "@/lib/theme/genericInstituteTemplates";
import type { GenericLandingCopy } from "@/lib/landing/genericLandingCopy";
import {
  GENERIC_LANDING_SECTIONS,
  type GenericBandsLayout,
  type GenericLandingSection,
} from "@/lib/landing/genericLandingComposition";
import { GenericLandingMotion } from "@/components/organisms/generic-landing/GenericLandingMotion";

interface Band {
  id: GenericLandingSection;
  label: string;
  sentence: string;
  src: string;
}

function bandsFor(props: {
  kind: GenericInstituteKind;
  copy: GenericLandingCopy;
  sectionSrc?: Partial<Record<GenericLandingSection, string>>;
  sectionLabels?: Partial<Record<GenericLandingSection, string>>;
  hiddenSections?: ReadonlySet<string>;
}): Band[] {
  return GENERIC_LANDING_SECTIONS.filter((section) => !props.hiddenSections?.has(section)).map(
    (section) => ({
      id: section,
      label: props.sectionLabels?.[section] ?? section,
      sentence: props.copy.sections[section],
      src: props.sectionSrc?.[section] ?? genericSectionStockPath(props.kind, section),
    }),
  );
}

function BandPhoto({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local stock photo in public/generic
    <img src={src} alt={alt} width={1200} height={640} className={className} />
  );
}

export function GenericLandingBands(props: {
  layout: GenericBandsLayout;
  kind: GenericInstituteKind;
  copy: GenericLandingCopy;
  sectionSrc?: Partial<Record<GenericLandingSection, string>>;
  sectionLabels?: Partial<Record<GenericLandingSection, string>>;
  hiddenSections?: ReadonlySet<string>;
}) {
  const items = bandsFor(props);
  if (items.length === 0) return null;

  if (props.layout === "cluster") {
    const [first, ...rest] = items;
    if (!first) return null;
    return (
      <section data-bands-layout={props.layout}>
        <GenericLandingMotion>
          <figure id={first.id}>
            <BandPhoto src={first.src} alt={first.sentence} className="h-[62vh] w-full object-cover" />
            <figcaption className="mx-auto max-w-xl px-5 py-8">
              <h2 className="text-3xl font-medium tracking-tight">{first.label}</h2>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">{first.sentence}</p>
            </figcaption>
          </figure>
        </GenericLandingMotion>
        <div className="grid md:grid-cols-2">
          {rest.map((band, index) => (
            <GenericLandingMotion key={band.id} index={index}>
              <figure id={band.id}>
                <BandPhoto src={band.src} alt={band.sentence} className="h-64 w-full object-cover" />
                <figcaption className="px-5 py-6">
                  <h2 className="text-2xl font-medium tracking-tight">{band.label}</h2>
                  <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
                </figcaption>
              </figure>
            </GenericLandingMotion>
          ))}
        </div>
      </section>
    );
  }

  if (props.layout === "ruled") {
    return (
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8" data-bands-layout={props.layout}>
        {items.map((band, index) => (
          <GenericLandingMotion key={band.id} index={index}>
            <article id={band.id} className="grid items-center gap-5 border-t border-[var(--color-border)] py-8 sm:grid-cols-[9rem_1fr]">
              <BandPhoto src={band.src} alt={band.sentence} className="h-24 w-full object-cover" />
              <div>
                <p className="text-sm text-[var(--color-muted-foreground)]">{String(index + 1).padStart(2, "0")}</p>
                <h2 className="text-2xl font-medium tracking-tight">{band.label}</h2>
                <p className="mt-2 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
              </div>
            </article>
          </GenericLandingMotion>
        ))}
      </section>
    );
  }

  if (props.layout === "paper" || props.layout === "breaks") {
    return (
      <section data-bands-layout={props.layout}>
        {items.map((band, index) => (
          <GenericLandingMotion key={band.id} index={index}>
            <figure id={band.id} className={props.layout === "paper" ? "mx-auto max-w-5xl px-5 py-10" : ""}>
              <BandPhoto
                src={band.src}
                alt={band.sentence}
                className={
                  props.layout === "paper"
                    ? "aspect-video w-full object-cover"
                    : "h-[42vh] w-full object-cover"
                }
              />
              <figcaption className="mx-auto max-w-xl px-5 py-8">
                <h2 className="text-3xl font-medium tracking-tight">{band.label}</h2>
                <p className="mt-3 text-base leading-relaxed text-[var(--color-muted-foreground)]">{band.sentence}</p>
              </figcaption>
            </figure>
          </GenericLandingMotion>
        ))}
      </section>
    );
  }

  return (
    <section data-bands-layout={props.layout}>
      {items.map((band, index) => (
        <GenericLandingMotion key={band.id} index={index}>
          <article id={band.id} className="grid min-h-[68vh] lg:grid-cols-2">
            <BandPhoto
              src={band.src}
              alt={band.sentence}
              className={`h-72 w-full object-cover lg:h-full ${index % 2 === 1 ? "lg:order-2" : ""}`}
            />
            <div className="flex flex-col justify-center px-5 py-14 sm:px-12">
              <h2 className="text-3xl font-medium tracking-tight">{band.label}</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-muted-foreground)]">
                {band.sentence}
              </p>
            </div>
          </article>
        </GenericLandingMotion>
      ))}
    </section>
  );
}
