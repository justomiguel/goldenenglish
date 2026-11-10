import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MATISS_GROUPS } from "@/lib/landing/matissSchedule";
import { MatissAgeFinder } from "@/components/organisms/MatissAgeFinder";
import { LandingMatissFooter } from "@/components/organisms/LandingMatissFooter";
import { LandingMatissHero } from "@/components/organisms/LandingMatissHero";
import { LandingMatissManifesto } from "@/components/organisms/LandingMatissManifesto";
import { LandingMatissBenefits } from "@/components/organisms/LandingMatissBenefits";
import { LandingMatissPrograms } from "@/components/organisms/LandingMatissPrograms";
import { LandingMatissClassDay } from "@/components/organisms/LandingMatissClassDay";
import { LandingMatissFirstClass } from "@/components/organisms/LandingMatissFirstClass";
import { LandingMatissGala } from "@/components/organisms/LandingMatissGala";
import { LandingMatissGallery } from "@/components/organisms/LandingMatissGallery";
import { LandingMatissLocations } from "@/components/organisms/LandingMatissLocations";
import { LandingMatissFaq } from "@/components/organisms/LandingMatissFaq";
import { LandingMatissContact } from "@/components/organisms/LandingMatissContact";
import { landingRegisterCtasFromDict } from "@/lib/settings/landingRegisterCtasFromDict";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

export interface LandingMatissImages {
  heroWeb: string;
  manifesto: string;
  benefits: string;
  programs: readonly string[];
  classes: readonly string[];
  gala: string;
  gallery: readonly string[];
  contact: string;
}

export interface LandingMatissSectionsProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  links: { href: string; label: string }[];
  images: LandingMatissImages;
  publicCtaMode?: PublicCtaMode;
  inscriptionsEnabled?: boolean;
}

export function LandingMatissSections({
  dict,
  brand,
  locale,
  links,
  images,
  publicCtaMode,
  inscriptionsEnabled,
}: LandingMatissSectionsProps) {
  const t = (path: string) => marketingLandingCopy(dict, "matiss", path);
  const list = <K extends string>(base: string, count: number, fields: readonly K[]) =>
    Array.from({ length: count }, (_, index) =>
      Object.fromEntries(fields.map((field) => [field, t(`${base}.${index}.${field}`)])) as Record<K, string>,
    ).filter((row) => Object.values(row).some(Boolean));
  const ctas = landingRegisterCtasFromDict({ locale, dict, publicCtaMode, inscriptionsEnabled });
  const primary = ctas[0];
  const locationNames = { sanMiguel: t("sedes.sanMiguel.name"), laFlorida: t("sedes.laFlorida.name") };
  const programs = Object.fromEntries(
    MATISS_GROUPS.map((group) => [
      group.id,
      {
        name: t(`programas.groups.${group.id}.name`),
        body: t(`programas.groups.${group.id}.body`),
        alt: t(`programas.groups.${group.id}.alt`),
      },
    ]),
  );
  const groupNames = Object.fromEntries(Object.entries(programs).map(([id, copy]) => [id, copy.name]));
  const seal = { sealRing: t("seal.ring"), logoSrc: brand.logoPath };

  return (
    <>
      <LandingMatissHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        facts={[0, 1, 2].map((n) => t(`hero.facts.${n}`)).filter(Boolean)}
        primaryHref={primary?.href}
        primaryLabel={t("hero.ctaPrimary")}
        secondaryHref={`/${locale}#clases`}
        secondaryLabel={t("hero.ctaSecondary")}
        photoSrc={images.heroWeb}
        photoAlt={t("hero.photoAlt")}
        {...seal}
        logoAlt={brand.logoAlt || brand.name}
      />

      <LandingMatissManifesto
        title={t("manifiesto.title")}
        body={t("manifiesto.body")}
        alt={t("manifiesto.alt")}
        src={images.manifesto}
      />

      <LandingMatissBenefits
        kicker={t("sobreNosotros.kicker")}
        title={t("sobreNosotros.title")}
        lead={t("sobreNosotros.bodyP1")}
        director={t("sobreNosotros.bodyP2")}
        items={list("sobreNosotros.items", 4, ["title", "body"] as const)}
        photoSrc={images.benefits}
        photoAlt={t("sobreNosotros.photoAlt")}
        {...seal}
      />

      <LandingMatissPrograms
        title={t("programas.sectionTitle")}
        lead={t("programas.lead")}
        dayLabels={{ saturday: t("horarios.days.saturday"), sunday: t("horarios.days.sunday") }}
        yearsLabel={t("edad.years")}
        locationNames={locationNames}
        programs={programs}
        photos={images.programs}
      >
        <div id="horarios" className="mt-20 scroll-mt-24 rounded-[40px] bg-[var(--matiss-lavender)] p-6 md:p-12">
          <MatissAgeFinder
            title={t("edad.sectionTitle")}
            lead={t("edad.lead")}
            yearsLabel={t("edad.years")}
            emptyLabel={t("edad.empty")}
            dayLabels={{ saturday: t("horarios.days.saturday"), sunday: t("horarios.days.sunday") }}
            photoSmall={images.programs[0] ?? images.heroWeb}
            photoBig={images.programs[1] ?? images.heroWeb}
            photoAltSmall={t("edad.photoAltSmall")}
            photoAltBig={t("edad.photoAltBig")}
            locationNames={locationNames}
            groupNames={groupNames}
          />
        </div>
      </LandingMatissPrograms>

      <LandingMatissClassDay
        title={t("clases.sectionTitle")}
        lead={t("clases.lead")}
        steps={list("clases.steps", 4, ["title", "body"] as const)}
        photos={images.classes}
      />

      <LandingMatissFirstClass
        title={t("primeraClase.title")}
        steps={list("primeraClase.steps", 3, ["title", "body"] as const)}
        buttonHref={primary?.href}
        buttonLabel={t("primeraClase.button")}
      />

      <LandingMatissGala title={t("gala.title")} body={t("gala.body")} photoSrc={images.gala} photoAlt={t("gala.alt")} {...seal} />

      <LandingMatissGallery title={t("galeria.sectionTitle")} alt={t("galeria.alt")} photos={images.gallery} />

      <LandingMatissLocations
        title={t("sedes.sectionTitle")}
        lead={t("sedes.lead")}
        mapsLabel={t("sedes.maps")}
        locations={(["sanMiguel", "laFlorida"] as const).map((key) => ({
          key,
          name: t(`sedes.${key}.name`),
          body: t(`sedes.${key}.body`),
          address: t(`sedes.${key}.address`),
        }))}
      />

      <LandingMatissFaq title={t("faq.title")} items={list("faq.items", 6, ["q", "a"] as const)} />

      <LandingMatissContact
        locale={locale}
        dict={dict}
        title={t("cta.title")}
        subtitle={t("cta.subtitle")}
        photoSrc={images.contact}
        photoAlt={t("cta.photoAlt")}
        whatsappHref={brand.socialWhatsapp}
        primaryHref={primary?.href}
        primaryLabel={t("cta.button")}
        {...seal}
      />

      <LandingMatissFooter dict={dict} brand={brand} locale={locale} links={links} />
    </>
  );
}
