import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoReveal } from "@/components/organisms/NagoReveal";

const ITEMS = ["t1", "t2", "t3"] as const;

export function LandingNagoTestimonials({ dict }: { dict: Dictionary }) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section className="nago-section bg-[var(--nago-bg-2)] px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]">
      <div className="mx-auto max-w-7xl">
        <NagoReveal>
          <h2 className="nago-display text-3xl text-[var(--nago-heading-solid)] md:text-4xl">
            {t("testimonios.sectionTitle")}
          </h2>
        </NagoReveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {ITEMS.map((key, i) => (
            <NagoReveal
              key={key}
              as="article"
              delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
              className="border-t border-[var(--nago-gold)]/25 pt-5"
            >
              <p className="text-base leading-relaxed text-[var(--nago-ink)]">
                “{t(`testimonios.${key}.quote`)}”
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--nago-gold)]">
                {t(`testimonios.${key}.role`)}
              </p>
            </NagoReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
