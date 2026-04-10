import { BookOpen, Library, Trophy } from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";

interface LandingLevelsProps {
  dict: Dictionary;
}

const bandClass =
  "group relative overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] md:p-7";

export function LandingLevels({ dict }: LandingLevelsProps) {
  const stroke = 1.75;
  const bands = [
    {
      title: dict.landing.levels.beginner,
      items: [dict.landing.levels.a1, dict.landing.levels.a2],
      tint: "from-[var(--color-primary)]/15",
      Icon: BookOpen,
    },
    {
      title: dict.landing.levels.intermediate,
      items: [dict.landing.levels.b1, dict.landing.levels.b2],
      tint: "from-[var(--color-secondary)]/12",
      Icon: Library,
    },
    {
      title: dict.landing.levels.advanced,
      items: [dict.landing.levels.c1, dict.landing.levels.c2],
      tint: "from-[var(--color-accent)]/25",
      Icon: Trophy,
    },
  ];

  return (
    <LandingSection id="niveles" title={dict.landing.levels.title}>
      <p className="mx-auto mb-12 max-w-3xl text-center text-lg leading-relaxed text-[var(--color-muted-foreground)]">
        {dict.landing.levels.intro}
      </p>
      <div className="relative grid gap-6 md:grid-cols-3 md:gap-8">
        <div
          className="pointer-events-none absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent md:block"
          aria-hidden="true"
        />
        {bands.map((band) => {
          const BandIcon = band.Icon;
          return (
            <div key={band.title} className={bandClass}>
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${band.tint} to-transparent`}
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
    </LandingSection>
  );
}
