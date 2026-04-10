import {
  Baby,
  Building2,
  Check,
  MonitorPlay,
  School,
  UserRound,
} from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import { LandingStudentGallery } from "@/components/molecules/LandingStudentGallery";
import type { Dictionary } from "@/types/i18n";

interface LandingModalitiesProps {
  dict: Dictionary;
}

const stroke = 1.75;
const iconClass = "h-4 w-4 shrink-0 text-[var(--color-primary)]/75";

export function LandingModalities({ dict }: LandingModalitiesProps) {
  const m = dict.landing.modalities;
  const presencialItems = [m.presencial.b1, m.presencial.b2, m.presencial.b3];
  const remotaItems = [m.remota.b1, m.remota.b2, m.remota.b3];
  const audiences: { icon: typeof Baby; label: string }[] = [
    { icon: Baby, label: m.kids },
    { icon: School, label: m.teens },
    { icon: UserRound, label: m.adults },
  ];

  return (
    <LandingSection
      id="modalidades"
      title={m.title}
      className="relative overflow-visible"
    >
      <div className="relative">
        <div
          className="pointer-events-none absolute left-1/2 top-[5rem] -z-10 min-h-[70%] w-screen max-w-[100vw] -translate-x-1/2 bg-[var(--color-accent)]/[0.11]"
          aria-hidden
        />
        <p className="relative mx-auto max-w-3xl text-center text-base leading-relaxed text-[var(--color-foreground)] md:text-lg">
          {m.intro}
        </p>

        <div className="relative mx-auto mt-10 max-w-5xl rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] md:p-8">
          <h3 className="font-display mb-5 text-center text-lg font-semibold text-[var(--color-secondary)] md:text-xl md:text-left">
            {m.audiencesTitle}
          </h3>
          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {audiences.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-[calc(var(--layout-border-radius)-4px)] border border-transparent py-1 text-[var(--color-foreground)]"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-primary)]">
                  <Icon
                    className={iconClass}
                    aria-hidden
                    strokeWidth={stroke}
                  />
                </span>
                <span className="text-sm leading-relaxed md:text-base">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-2 md:gap-10">
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)] md:p-9">
          <h3 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--color-primary)]">
            <Building2
              className="h-5 w-5 shrink-0 text-[var(--color-primary)]/85"
              aria-hidden
              strokeWidth={stroke}
            />
            {m.presencial.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
            {m.presencial.lead}
          </p>
          <ul className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm leading-relaxed text-[var(--color-foreground)]">
            {presencialItems.map((text) => (
              <li key={text} className="flex gap-2.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                  strokeWidth={stroke}
                />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/18 bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-accent)]/18 md:p-9">
          <h3 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold text-[var(--color-primary)]">
            <MonitorPlay
              className="h-5 w-5 shrink-0 text-[var(--color-primary)]/85"
              aria-hidden
              strokeWidth={stroke}
            />
            {m.remota.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)] md:text-base">
            {m.remota.lead}
          </p>
          <ul className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm leading-relaxed text-[var(--color-foreground)]">
            {remotaItems.map((text) => (
              <li key={text} className="flex gap-2.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]"
                  aria-hidden
                  strokeWidth={stroke}
                />
                {text}
              </li>
            ))}
          </ul>
        </div>
        </div>

      <LandingStudentGallery dict={dict} />
      </div>
    </LandingSection>
  );
}
