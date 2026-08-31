import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { NagoReveal } from "@/components/organisms/NagoReveal";
import {
  NagoIconConfianza,
  NagoIconCultura,
  NagoIconDeporte,
  NagoIconDisciplina,
  NagoIconSuperacion,
} from "@/components/organisms/NagoLineIcons";

const PILLARS = [
  { key: "deporte", Icon: NagoIconDeporte },
  { key: "disciplina", Icon: NagoIconDisciplina },
  { key: "confianza", Icon: NagoIconConfianza },
  { key: "cultura", Icon: NagoIconCultura },
  { key: "superacion", Icon: NagoIconSuperacion },
] as const;

export function LandingNagoPillars({ dict }: { dict: Dictionary }) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);

  return (
    <section className="nago-section px-[max(1.25rem,env(safe-area-inset-left))] pe-[max(1.25rem,env(safe-area-inset-right))]">
      <div className="nago-pillars mx-auto max-w-7xl">
        {PILLARS.map(({ key, Icon }, i) => (
          <NagoReveal
            key={key}
            as="article"
            from={i % 2 === 0 ? "left" : "right"}
            delay={i < 3 ? ((i + 1) as 1 | 2 | 3) : undefined}
          >
            <Icon className="nago-pillar-icon" />
            <h2 className="nago-display mt-4 text-sm text-[var(--nago-gold)] md:text-base">
              {t(`pilares.${key}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--nago-ink-muted)]">
              {t(`pilares.${key}.body`)}
            </p>
          </NagoReveal>
        ))}
      </div>
    </section>
  );
}
