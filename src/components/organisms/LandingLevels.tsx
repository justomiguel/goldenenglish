import { BookOpen, Library, Trophy } from "lucide-react";
import { LandingCefrIntroBanner } from "@/components/molecules/LandingCefrIntroBanner";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";

interface LandingLevelsProps {
  dict: Dictionary;
}

const bandClass =
  "group relative overflow-hidden rounded-3xl p-6 shadow-[0_16px_48px_-20px_rgb(16_58_92_/16%)] transition duration-300 hover:-translate-y-[3px] hover:shadow-[0_22px_50px_-18px_rgb(16_58_92_/22%)] md:p-8";

const bandSurface: Record<
  "beginner" | "intermediate" | "advanced",
  string
> = {
  beginner:
    "bg-gradient-to-br from-[var(--color-primary)]/[0.07] from-0% via-[var(--color-surface)] via-45% to-[var(--color-surface)] ring-1 ring-[var(--color-primary)]/10",
  intermediate:
    "bg-gradient-to-br from-[var(--color-secondary)]/[0.06] from-0% via-[var(--color-surface)] via-45% to-[var(--color-surface)] ring-1 ring-[var(--color-secondary)]/12",
  advanced:
    "bg-gradient-to-br from-[var(--color-accent)]/[0.12] from-0% via-[var(--color-surface)] via-40% to-[var(--color-surface)] ring-1 ring-[var(--color-accent)]/28",
};

const bandListBorder: Record<
  "beginner" | "intermediate" | "advanced",
  string
> = {
  beginner: "border-[var(--color-primary)]/22",
  intermediate: "border-[var(--color-secondary)]/22",
  advanced: "border-[var(--color-accent)]/40",
};

const bandIconWrap: Record<
  "beginner" | "intermediate" | "advanced",
  string
> = {
  beginner:
    "bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-[var(--color-primary)] ring-[var(--color-primary)]/12",
  intermediate:
    "bg-[color-mix(in_srgb,var(--color-secondary)_10%,var(--color-surface))] text-[var(--color-secondary)] ring-[var(--color-secondary)]/15",
  advanced:
    "bg-[color-mix(in_srgb,var(--color-accent)_22%,var(--color-surface))] text-[var(--color-primary)] ring-[var(--color-accent)]/30",
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
          className="pointer-events-none absolute left-1/2 top-[3rem] -z-10 h-[calc(100%-3rem)] w-[min(100vw,100%)] max-w-[100vw] -translate-x-1/2 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,color-mix(in_srgb,var(--color-secondary)_14%,transparent)_0%,transparent_65%)] opacity-90 md:top-[4.5rem]"
          aria-hidden
        />
        <LandingCefrIntroBanner
          introLead={dict.landing.levels.introLead}
          introEmphasis={dict.landing.levels.introEmphasis}
          introTrail={dict.landing.levels.introTrail}
          scaleAria={dict.landing.levels.scaleAria}
        />

        <div className="relative mt-2 grid gap-7 md:grid-cols-3 md:gap-8">
          {bands.map((band) => {
            const BandIcon = band.Icon;
            const listBorder = bandListBorder[band.key];
            const iconWrap = bandIconWrap[band.key];
            return (
              <div
                key={band.title}
                className={`${bandClass} ${bandSurface[band.key]}`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${band.tint} to-transparent opacity-90`}
                  aria-hidden
                />
                <h3 className="font-display relative mb-6 flex items-center justify-center gap-2.5 text-center text-xl font-semibold tracking-tight text-[var(--color-primary)] md:text-[1.35rem]">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${iconWrap}`}
                  >
                    <BandIcon
                      className="h-5 w-5"
                      aria-hidden
                      strokeWidth={stroke}
                    />
                  </span>
                  {band.title}
                </h3>
                <ul className={`relative space-y-3 border-l-2 ${listBorder} pl-4`}>
                  {band.items.map((item) => (
                    <li
                      key={item}
                      className="text-[0.9375rem] leading-snug text-[var(--color-foreground)]"
                    >
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
