import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoReveal } from "@/components/organisms/NagoReveal";

const GROUPS = [
  "baby",
  "kids47",
  "kids810",
  "teens",
  "mixta",
  "adultos",
  "mayores",
] as const;

const WEEKLY_FEES = [40_000, 50_000, 60_000, 70_000, 80_000, 90_000] as const;

export function formatNagoClp(amount: number, locale: string): string {
  const grouped = new Intl.NumberFormat(locale === "en" ? "en-US" : "de-DE", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `$${grouped}`;
}

export function LandingNagoHorarios({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section
      id="horarios"
      className="nago-section scroll-mt-24 bg-[var(--nago-bg-2)] px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]"
    >
      <div className="mx-auto max-w-7xl">
        <NagoReveal>
          <h2 className="nago-display text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
            {t("horarios.sectionTitle")}
          </h2>
          <div className="nago-rule-soft mt-4 h-px w-12 bg-[var(--nago-gold)]" aria-hidden />
          <p className="mt-5 max-w-2xl text-[var(--nago-ink-muted)]">{t("horarios.lead")}</p>
          <p className="mt-2 text-sm font-medium tracking-wide text-[var(--nago-gold-soft)]">
            {t("horarios.venue")}
          </p>
        </NagoReveal>
        <div className="nago-horario-list mt-10">
          {GROUPS.map((key, i) => (
            <NagoReveal
              key={key}
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
              className="nago-horario-row"
            >
              <div className="min-w-0">
                <p className="nago-horario-title">{t(`horarios.${key}.title`)}</p>
                <p className="nago-horario-ages">{t(`horarios.${key}.ages`)}</p>
              </div>
              <div className="nago-horario-slots">
                <p>{t(`horarios.${key}.slots`)}</p>
                {key === "mayores" ? (
                  <p className="nago-horario-extra">{t("horarios.mayores.note")}</p>
                ) : null}
              </div>
            </NagoReveal>
          ))}
        </div>
        <NagoReveal>
          <div className="nago-horario-fees mt-10">
            <p className="nago-horario-fees-title">{t("horarios.pricesTitle")}</p>
            <div className="nago-fee-grid">
              {WEEKLY_FEES.map((amount, index) => {
                const times = index + 1;
                const label =
                  times === 1
                    ? t("horarios.timesOne")
                    : t("horarios.timesMany").replace("{n}", String(times));
                return (
                  <div
                    key={amount}
                    className="nago-fee-card"
                    data-featured={times === 2 ? "true" : undefined}
                  >
                    <p className="nago-fee-times">{label}</p>
                    <p className="nago-fee-amount">{formatNagoClp(amount, locale)}</p>
                  </div>
                );
              })}
            </div>
            <div className="nago-fee-aside">
              <div className="nago-fee-note">
                <p className="nago-fee-note-kicker">{t("horarios.trialKicker")}</p>
                <p className="mt-2 text-lg font-semibold text-[var(--nago-heading-solid)]">
                  {formatNagoClp(15_000, locale)}
                </p>
                <p className="text-sm leading-relaxed text-[var(--nago-ink-muted)]">
                  {t("horarios.trial")}
                </p>
              </div>
              <div className="nago-fee-note">
                <p className="nago-fee-note-kicker">{t("horarios.familyKicker")}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--nago-ink-muted)]">
                  {t("horarios.family")}
                </p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-sm text-[var(--nago-ink-muted)]">{t("horarios.note")}</p>
          <Link href={`/${locale}/register`} className="nago-btn nago-btn-solid mt-6">
            {t("horarios.cta")}
          </Link>
        </NagoReveal>
      </div>
    </section>
  );
}
