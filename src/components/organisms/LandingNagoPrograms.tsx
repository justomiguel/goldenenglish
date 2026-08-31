import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";

const PROGRAMS = [
  { key: "ninos", src: NAGO_TEMPLATE.ninos },
  { key: "jovenes", src: NAGO_TEMPLATE.jovenes },
  { key: "adultos", src: NAGO_TEMPLATE.adultos },
  { key: "mayores", src: NAGO_TEMPLATE.mayores },
] as const;

export function LandingNagoPrograms({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section
      id="clases"
      className="nago-section nago-band-light scroll-mt-24 px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
    >
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.7fr)] lg:items-end">
        <NagoReveal variant="mask">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--nago-gold)]">
            {t("programas.kicker")}
          </p>
          <h2 className="nago-display mt-3 text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
            {t("programas.sectionTitle")}
          </h2>
          <div className="nago-rule-soft mt-4 h-px w-12 bg-[var(--nago-gold)]" aria-hidden />
          <p className="mt-5 max-w-md text-[var(--nago-ink-muted)]">{t("programas.lead")}</p>
          <p className="mt-2 text-sm font-medium text-[var(--nago-gold)]">
            {t("programas.noExperience")}
          </p>
          <Link href={`/${locale}#horarios`} className="nago-btn nago-btn-solid mt-7">
            {t("programas.ctaHorarios")} →
          </Link>
        </NagoReveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map(({ key, src }, i) => (
            <NagoReveal
              key={key}
              variant="media"
              from={i % 2 === 0 ? "left" : "right"}
              drift={i % 2 === 0 ? 20 : -16}
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
            >
              <Link
                href={`/${locale}#horarios`}
                className="nago-program-card block"
                aria-label={`${t(`programas.${key}.title`)} — ${t("programas.verClases")}`}
              >
                <div className="nago-program-card-media">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width:640px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="nago-program-card-bar" data-tone={key}>
                  <p className="nago-display text-base leading-none">
                    {t(`programas.${key}.title`)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] opacity-90">
                    {t(`programas.${key}.ages`)}
                  </p>
                </div>
                <div className="nago-program-card-body">
                  <p className="text-sm leading-snug text-[var(--nago-ink-muted)]">
                    {t(`programas.${key}.body`)}
                  </p>
                  <span className="mt-auto inline-flex pt-3 text-[var(--nago-gold)]" aria-hidden>
                    →
                  </span>
                </div>
              </Link>
            </NagoReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
