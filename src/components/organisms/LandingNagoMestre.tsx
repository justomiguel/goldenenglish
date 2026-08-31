import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import { NagoCountUp } from "@/components/organisms/NagoCountUp";

const STATS = [
  { valueKey: "years", labelKey: "yearsLabel" },
  { valueKey: "students", labelKey: "studentsLabel" },
  { valueKey: "events", labelKey: "eventsLabel" },
  { valueKey: "chile", labelKey: "chileLabel" },
] as const;

export function LandingNagoMestre({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section className="nago-section nago-band-sand scroll-mt-24 px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
        <NagoReveal variant="media" drift={-24} className="nago-mestre-pin">
          <div className="relative aspect-[3/4] overflow-hidden md:aspect-[4/5]">
            <Image
              src={NAGO_TEMPLATE.mestre}
              alt=""
              fill
              sizes="(max-width:768px) 100vw, 50vw"
              className="object-cover object-[center_20%]"
            />
          </div>
        </NagoReveal>
        <NagoReveal variant="mask">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--nago-gold)]">
            {t("mestre.kicker")}
          </p>
          <h2 className="nago-display mt-3 text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
            {t("mestre.title")}
          </h2>
          <div className="nago-rule-soft mt-4 h-px w-12 bg-[var(--nago-gold)]" aria-hidden />
          <p className="mt-5 max-w-lg text-pretty leading-relaxed text-[var(--nago-ink-muted)]">
            {t("mestre.body")}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5">
            {STATS.map((stat) => (
              <div key={stat.valueKey} className="nago-stat">
                <p className="nago-display text-2xl text-[var(--nago-gold)]">
                  <NagoCountUp value={t(`mestre.${stat.valueKey}`)} />
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[var(--nago-ink-muted)]">
                  {t(`mestre.${stat.labelKey}`)}
                </p>
              </div>
            ))}
          </div>
          <Link
            href={`/${locale}#contacto`}
            className="mt-8 inline-flex min-h-[44px] items-center text-sm font-semibold uppercase tracking-[0.08em] text-[var(--nago-gold)]"
          >
            {t("mestre.cta")} →
          </Link>
        </NagoReveal>
      </div>
    </section>
  );
}
