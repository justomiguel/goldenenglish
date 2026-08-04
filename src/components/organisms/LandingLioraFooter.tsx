import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { BrandInstagramIcon } from "@/components/atoms/BrandSocialIcons";
import { LIORA_SEDE_KEYS } from "@/lib/landing/lioraSchedule";

interface LandingLioraFooterProps {
  dict: Dictionary;
  brand: BrandPublic;
  locale: string;
  t: (path: string) => string;
}

export function LandingLioraFooter({
  dict,
  brand,
  locale,
  t,
}: LandingLioraFooterProps) {
  const links = [
    { href: `/${locale}#sobre`, label: t("nav.sobreNosotros") },
    { href: `/${locale}#clases`, label: t("nav.clases") },
    { href: `/${locale}#horarios`, label: t("nav.horarios") },
    { href: `/${locale}#galeria`, label: t("nav.galeria") },
    { href: `/${locale}/events`, label: t("nav.eventos") },
    { href: `/${locale}#contacto`, label: t("nav.contacto") },
  ];
  // Site setup (`social.*`, `contact.*`) manda; el diccionario queda como
  // respaldo para deploys sin tema cargado.
  const ig = brand.socialInstagram.trim() || t("contact.instagramUrl").trim();
  const wa = brand.socialWhatsapp.trim() || t("contact.whatsappUrl").trim();
  // El teléfono y el email salen solo de site setup: no tienen respaldo en el
  // diccionario para no publicar un número de ejemplo como enlace `tel:`.
  const phone = brand.contactPhone.trim();
  const email = brand.contactEmail.trim();

  return (
    <footer className="bg-[var(--liora-footer)] px-[max(1.5rem,env(safe-area-inset-left))] py-16 pb-[max(2rem,env(safe-area-inset-bottom))] pe-[max(1.5rem,env(safe-area-inset-right))] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4 md:gap-12">
        <div className="flex flex-col items-start gap-5 md:col-span-2">
          {brand.logoPath ? (
            <div className="inline-flex rounded-2xl bg-[var(--liora-cream)] px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local + Storage URLs */}
              <img
                src={brand.logoPath}
                alt={brand.logoAlt}
                className="h-24 w-auto max-w-[180px] object-contain"
              />
            </div>
          ) : null}
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            {t("hero.tagline")}
          </p>

          {phone || email ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--liora-rose)]">
                {t("footer.contactoTitle")}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {phone ? (
                  <li>
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="inline-flex items-center gap-2.5 text-white/85 transition hover:text-white"
                    >
                      <Phone className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
                      {phone}
                    </a>
                  </li>
                ) : null}
                {email ? (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      className="inline-flex items-center gap-2.5 break-all text-white/85 transition hover:text-white"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.5} />
                      {email}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>

        <nav aria-label={t("footer.enlacesTitle")}>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--liora-rose)]">
            {t("footer.enlacesTitle")}
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-white/85 underline decoration-white/30 underline-offset-4 transition hover:text-white hover:decoration-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--liora-rose)]">
            {t("footer.sedesTitle")}
          </p>
          <ul className="mt-5 space-y-3 text-sm text-white/85">
            {LIORA_SEDE_KEYS.map((sedeKey) => (
              <li key={sedeKey}>
                <span className="block font-medium text-white">
                  {t(`sedes.${sedeKey}.name`)}
                </span>
                <span className="block text-white/70">
                  {t(`sedes.${sedeKey}.metro`)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-xs font-medium uppercase tracking-[0.3em] text-[var(--liora-rose)]">
            {t("footer.siguenos")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {ig ? (
              <a
                href={ig}
                className="liora-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.instagramAria")}
              >
                <BrandInstagramIcon className="h-4 w-4" />
              </a>
            ) : null}
            {wa ? (
              <a
                href={wa}
                className="liora-social-icon"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("chrome.whatsappAria")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden strokeWidth={1.5} />
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl justify-center border-t border-white/10 pt-6">
        <LanguageSwitcher
          locale={locale}
          labels={dict.common.locale}
          variant="compactDark"
        />
      </div>
      <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-white/55">
        © {new Date().getFullYear()} {brand.legalName} — {t("footer.rightsLine")}
      </p>
    </footer>
  );
}
