import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NAGO_TEMPLATE } from "@/lib/landing/nagoTemplateImages";
import { NagoReveal } from "@/components/organisms/NagoReveal";

const EVENTS = [
  { key: "e1", src: NAGO_TEMPLATE.evtWinter },
  { key: "e2", src: NAGO_TEMPLATE.evtRoda },
  { key: "e3", src: NAGO_TEMPLATE.evtBrasil },
] as const;

export function LandingNagoEvents({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: string;
}) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section className="nago-section px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-7xl">
        <NagoReveal>
          <h2 className="nago-display text-4xl text-[var(--nago-heading-solid)] md:text-5xl">
            {t("eventosHome.sectionTitle")}
          </h2>
          <p className="mt-4 max-w-lg text-[var(--nago-ink-muted)]">{t("eventosHome.lead")}</p>
        </NagoReveal>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {EVENTS.map(({ key, src }, i) => (
            <NagoReveal key={key} delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}>
              <Link href={`/${locale}/events`} className="nago-event-photo group">
                <Image src={src} alt="" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                <div className="nago-event-photo-veil" aria-hidden />
                <div className="relative z-10 flex h-full flex-col justify-end p-5">
                  <p className="nago-display text-3xl text-[var(--nago-gold)]">
                    {t(`eventosHome.${key}.date`)}
                    <span className="ml-2 text-sm tracking-[0.14em]">
                      {t(`eventosHome.${key}.month`)}
                    </span>
                  </p>
                  <p className="nago-display mt-2 text-lg text-white group-hover:text-[var(--nago-gold)]">
                    {t(`eventosHome.${key}.title`)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-white/75">
                    {t(`eventosHome.${key}.place`)}
                  </p>
                </div>
              </Link>
            </NagoReveal>
          ))}
        </div>
        <NagoReveal>
          <Link
            href={`/${locale}/events`}
            className="mt-6 inline-flex min-h-[44px] items-center text-sm font-semibold uppercase tracking-[0.08em] text-[var(--nago-gold)]"
          >
            {t("eventosHome.viewAll")} →
          </Link>
        </NagoReveal>
      </div>
    </section>
  );
}
