import { BookOpen, Library, Trophy } from "lucide-react";
import { LandingCefrIntroBanner } from "@/components/molecules/LandingCefrIntroBanner";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";

interface LandingLevelsProps {
  dict: Dictionary;
}

const bandClass =
  "group relative overflow-hidden rounded-2xl p-6 shadow-[0_12px_40px_-16px_rgb(16_58_92_/14%)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-14px_rgb(16_58_92_/20%)] md:p-7";

const bandSurface: Record<
  "beginner" | "intermediate" | "advanced",
  string
> = {
  beginner:
    "bg-gradient-to-b from-[var(--color-primary)]/[0.09] via-[var(--color-surface)] to-[var(--color-surface)] ring-1 ring-[var(--color-primary)]/12",
  intermediate:
    "bg-gradient-to-b from-[var(--color-secondary)]/[0.08] via-[var(--color-surface)] to-[var(--color-surface)] ring-1 ring-[var(--color-secondary)]/14",
  advanced:
    "bg-gradient-to-b from-[var(--color-accent)]/[0.14] via-[var(--color-surface)] to-[var(--color-surface)] ring-1 ring-[var(--color-accent)]/35",
};

export function LandingLevels({ dict }: LandingLevelsProps) {
  const stroke = 1.75;
  const bands = [
    {
      key: "beginner" as const,
      title: dict.landing.levels.beginner,
      items: [dict.landing.levels.a1, dict.landing.levels.a2],
      tint: "from-[var(--color-primary)]/15",
      Icon: BookOpen,
    },
    {
      key: "intermediate" as const,
      title: dict.landing.levels.intermediate,
      items: [dict.landing.levels.b1, dict.landing.levels.b2],
      tint: "from-[var(--color-secondary)]/12",
      Icon: Library,
    },
    {
      key: "advanced" as const,
      title: dict.landing.levels.advanced,
      items: [dict.landing.levels.c1, dict.landing.levels.c2],
      tint: "from-[var(--color-accent)]/25",
      Icon: Trophy,
    },
  ];

  return (
    <LandingSection
      id="niveles"
      title={dict.landing.levels.title}
      className="relative"
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute left-1/2 top-[4.5rem] -z-10 h-[calc(100%-2rem)] w-screen max-w-[100vw] -translate-x-1/2 bg-[var(--color-secondary)]/[0.07]"
          aria-hidden
        />
        <LandingCefrIntroBanner
          introLead={dict.landing.levels.introLead}
          introEmphasis={dict.landing.levels.introEmphasis}
          introTrail={dict.landing.levels.introTrail}
          scaleAria={dict.landing.levels.scaleAria}
        />
        <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent md:block"
            aria-hidden="true"
          />
          {bands.map((band) => {
            const BandIcon = band.Icon;
            return (
              <div
                key={band.title}
                className={`${bandClass} ${bandSurface[band.key]}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${band.tint} to-transparent opacity-80`}
                  aria-hidden="true"
                />
                <h3 className="font-display relative mb-5 flex items-center justify-center gap-2 text-center text-lg font-semibold text-[var(--color-primary)]">
                  <BandIcon
                    className="h-4 w-4 shrink-0 text-[var(--color-primary)]/65"
                    aria-hidden
                    strokeWidth={stroke}
                  />
                  {band.title}
                </h3>
                <ul className="relative space-y-3">
                  {band.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 rounded-md py-1.5 text-sm text-[var(--color-foreground)] transition group-hover:bg-[var(--color-muted)]/60"
                    >
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-bold text-[var(--color-primary)]"
                        aria-hidden="true"
                      >
                        {item.charAt(0)}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </LandingSection>
  );
}
