import { Baby, Check, School, UserRound, Video } from "lucide-react";
import { LandingSection } from "@/components/molecules/LandingSection";
import type { Dictionary } from "@/types/i18n";

interface LandingOfferProps {
  dict: Dictionary;
}

const iconClass = "h-4 w-4 shrink-0 text-[var(--color-primary)]/75";
const stroke = 1.75;

interface AudienceRow {
  icon: typeof Baby;
  label: string;
}

export function LandingOffer({ dict }: LandingOfferProps) {
  const audiences: AudienceRow[] = [
    { icon: Baby, label: dict.landing.offer.kids },
    { icon: School, label: dict.landing.offer.teens },
    { icon: UserRound, label: dict.landing.offer.adults },
  ];

  return (
    <LandingSection
      title={dict.landing.offer.title}
      className="relative bg-[var(--color-muted)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgb(16 58 92 / 6%) 0%, transparent 45%)",
        }}
        aria-hidden="true"
      />
      <div className="relative grid gap-10 md:grid-cols-2 md:gap-12">
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-soft)] md:p-10">
          <h3 className="font-display mb-6 text-xl font-semibold text-[var(--color-secondary)]">
            {dict.landing.offer.audiencesTitle}
          </h3>
          <ul className="space-y-4 text-[var(--color-foreground)]">
            {audiences.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-[calc(var(--layout-border-radius)-4px)] border border-transparent py-1 transition hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]"
              >
                <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-muted)] text-[var(--color-primary)]">
                  <Icon
                    className={iconClass}
                    aria-hidden
                    strokeWidth={stroke}
                  />
                </span>
                <span className="leading-relaxed">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-primary)]/15 bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-accent)]/20 md:p-10">
          <div
            className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[var(--color-primary)]/10 blur-2xl"
            aria-hidden="true"
          />
          <h3 className="font-display relative mb-4 flex items-center gap-2.5 text-xl font-semibold text-[var(--color-primary)]">
            <Video
              className="h-5 w-5 shrink-0 text-[var(--color-primary)]/80"
              aria-hidden
              strokeWidth={stroke}
            />
            {dict.landing.offer.onlineTitle}
          </h3>
          <p className="relative text-lg font-medium leading-relaxed text-[var(--color-foreground)]">
            {dict.landing.offer.onlineLead}
          </p>
          <ul className="relative mt-6 space-y-3 border-t border-[var(--color-border)] pt-6 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
            <li className="flex gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)] opacity-90"
                aria-hidden
                strokeWidth={stroke}
              />
              {dict.landing.offer.onlineB1}
            </li>
            <li className="flex gap-2.5">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)] opacity-90"
                aria-hidden
                strokeWidth={stroke}
              />
              {dict.landing.offer.onlineB2}
            </li>
          </ul>
        </div>
      </div>
    </LandingSection>
  );
}
