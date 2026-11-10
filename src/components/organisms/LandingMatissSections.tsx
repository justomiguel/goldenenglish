import Image from "next/image";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { MATISS_GROUPS } from "@/lib/landing/matissSchedule";
import { MatissAgeFinder } from "@/components/organisms/MatissAgeFinder";
import { MatissReveal } from "@/components/molecules/MatissReveal";
import { LandingMatissFooter } from "@/components/organisms/LandingMatissFooter";
import { LandingMatissHero } from "@/components/organisms/LandingMatissHero";
import { LandingMatissManifesto } from "@/components/organisms/LandingMatissManifesto";
import { LandingMatissContact } from "@/components/organisms/LandingMatissContact";
import { landingRegisterCtasFromDict } from "@/lib/settings/landingRegisterCtasFromDict";
import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

export interface LandingMatissImages {
  heroWeb: string;
  manifesto: string;
  ageSmall: string;
  ageBig: string;
  about: string;
  classes: readonly string[];
  gallery: readonly string[];
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

const CLASS_STEPS = ["0", "1", "2", "3"] as const;

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
  const ctas = landingRegisterCtasFromDict({ locale, dict, publicCtaMode, inscriptionsEnabled });
  const primary = ctas[0];

  return (
    <>
      <LandingMatissHero
        kicker={t("hero.kicker")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        primaryHref={primary?.href}
        primaryLabel={t("hero.ctaPrimary")}
        secondaryHref={`/${locale}#horarios`}
        secondaryLabel={t("hero.ctaSecondary")}
        photoSrc={images.heroWeb}
      />

      <LandingMatissManifesto
        title={t("manifiesto.title")}
        body={t("manifiesto.body")}
        alt={t("manifiesto.alt")}
        src={images.manifesto}
      />

      <MatissReveal preset="section">
      <section id="sobre" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <Image src={images.about} alt={t("galeria.sectionTitle")} width={1200} height={900} className="w-full rounded-[48px] object-cover" />
          <div>
            <p className="text-sm font-semibold text-[var(--matiss-rose-deep)]">{t("sobreNosotros.kicker")}</p>
            <h2 className="matiss-display mt-3 text-4xl text-[var(--matiss-ink)] md:text-5xl">{t("sobreNosotros.title")}</h2>
            <p className="mt-5 leading-relaxed text-[var(--matiss-ink-soft)]">{t("sobreNosotros.bodyP1")}</p>
            <p className="mt-4 leading-relaxed text-[var(--matiss-ink-soft)]">{t("sobreNosotros.bodyP2")}</p>
            <p className="mt-6 text-sm font-semibold text-[var(--matiss-ink)]">
              {t("contact.directorLabel")}: {t("contact.directorName")} · {t("contact.directorHandle")}
            </p>
          </div>
        </div>
      </section>
      </MatissReveal>

      <MatissReveal preset="steps">
      <section id="clases" className="scroll-mt-24 bg-[var(--matiss-lavender)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="mx-auto max-w-6xl">
          <h2 className="matiss-display text-4xl text-[var(--matiss-ink)] md:text-5xl">{t("clases.sectionTitle")}</h2>
          <p className="mt-3 text-[var(--matiss-ink-soft)]">{t("clases.lead")}</p>
          <ol className="matiss-stagger mt-10 grid gap-8 md:grid-cols-4">
            {CLASS_STEPS.map((step, index) => (
              <li key={step}>
                <Image src={images.classes[index] ?? images.classes[0]} alt="" width={600} height={600} className="h-40 w-full rounded-3xl object-cover" />
                <p className="matiss-display mt-4 text-xl text-[var(--matiss-ink)]">{t(`clases.steps.${index}.title`)}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--matiss-ink-soft)]">{t(`clases.steps.${index}.body`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      </MatissReveal>

      <MatissReveal preset="section">
      <section id="horarios" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="mx-auto max-w-6xl">
          <MatissAgeFinder
            title={t("edad.sectionTitle")}
            lead={t("edad.lead")}
            yearsLabel={t("edad.years")}
            emptyLabel={t("edad.empty")}
            dayLabel={t("horarios.day")}
            photoSmall={images.ageSmall}
            photoBig={images.ageBig}
            photoAltSmall={t("edad.photoAltSmall")}
            photoAltBig={t("edad.photoAltBig")}
            locationNames={{ sanMiguel: t("sedes.sanMiguel.name"), laFlorida: t("sedes.laFlorida.name") }}
            groupNames={{
              "babys-san-miguel": "Babys",
              "senior-san-miguel": "Senior",
              "babys-la-florida": "Babys",
            }}
          />
          <table className="mt-12 w-full text-left text-sm">
            <caption className="matiss-display mb-4 text-left text-3xl text-[var(--matiss-ink)]">{t("horarios.sectionTitle")}</caption>
            <thead>
              <tr className="text-[var(--matiss-ink-soft)]">
                <th className="py-2 font-semibold">{t("horarios.place")}</th>
                <th className="py-2 font-semibold">{t("horarios.group")}</th>
                <th className="py-2 font-semibold">{t("horarios.ages")}</th>
                <th className="py-2 font-semibold">{t("horarios.time")}</th>
              </tr>
            </thead>
            <tbody>
              {MATISS_GROUPS.map((group) => (
                <tr key={group.id} className="border-t border-[var(--matiss-line)]">
                  <td className="py-3">{group.location === "sanMiguel" ? t("sedes.sanMiguel.name") : t("sedes.laFlorida.name")}</td>
                  <td className="py-3">{group.id.startsWith("senior") ? "Senior" : "Babys"}</td>
                  <td className="py-3">{group.ageMin}–{group.ageMax}</td>
                  <td className="py-3">{t("horarios.day")} {group.start}–{group.end}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </MatissReveal>

      <section id="sedes" className="scroll-mt-24 bg-[var(--matiss-lavender)] px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
          {(["sanMiguel", "laFlorida"] as const).map((key) => (
            <article key={key}>
              <h2 className="matiss-display text-3xl text-[var(--matiss-ink)]">{t(`sedes.${key}.name`)}</h2>
              <p className="mt-3 leading-relaxed text-[var(--matiss-ink-soft)]">{t(`sedes.${key}.body`)}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t(`sedes.${key}.name`)}, Santiago`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-[var(--matiss-violet-deep)] underline"
              >
                {t("sedes.maps")}
              </a>
            </article>
          ))}
          <p className="text-sm text-[var(--matiss-ink-soft)] md:col-span-2">{t("sedes.lead")}</p>
        </div>
      </section>

      <MatissReveal preset="steps">
      <section id="galeria" className="scroll-mt-24 px-[max(1.5rem,env(safe-area-inset-left))] py-20 pe-[max(1.5rem,env(safe-area-inset-right))]">
        <div className="mx-auto max-w-6xl">
          <h2 className="matiss-display text-4xl text-[var(--matiss-ink)]">{t("galeria.sectionTitle")}</h2>
          <div className="matiss-stagger mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.gallery.map((src) => (
              <Image key={src} src={src} alt={t("galeria.sectionTitle")} width={600} height={750} className="h-56 w-full rounded-3xl object-cover md:h-72" />
            ))}
          </div>
        </div>
      </section>
      </MatissReveal>

      <LandingMatissContact
        locale={locale}
        dict={dict}
        title={t("cta.title")}
        subtitle={t("cta.subtitle")}
        photoSrc={images.about}
        photoAlt={t("edad.photoAltBig")}
        whatsappHref={brand.socialWhatsapp}
        primaryHref={primary?.href}
        primaryLabel={t("cta.button")}
      />

      <LandingMatissFooter dict={dict} brand={brand} locale={locale} links={links} />
    </>
  );
}
