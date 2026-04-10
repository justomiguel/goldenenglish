const LEVEL_CODES = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export interface LandingCefrIntroBannerProps {
  introLead: string;
  introEmphasis: string;
  introTrail: string;
  scaleAria: string;
}

/**
 * Intro MCER + escala visual: marco suave, franja con resplandor y nodos con relieve.
 */
export function LandingCefrIntroBanner({
  introLead,
  introEmphasis,
  introTrail,
  scaleAria,
}: LandingCefrIntroBannerProps) {
  return (
    <div className="relative mb-12 md:mb-14">
      <div className="overflow-hidden rounded-[1.75rem] border border-[color-mix(in_srgb,var(--color-primary)_12%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))] via-[var(--color-surface)] to-[color-mix(in_srgb,var(--color-accent)_5%,var(--color-surface))] p-6 shadow-[0_24px_64px_-28px_rgb(16_58_92_/22%)] ring-1 ring-[var(--color-primary)]/[0.04] md:rounded-[2rem] md:p-9">
        <p className="mx-auto max-w-[65ch] text-pretty text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-[1.0625rem] md:leading-[1.75]">
          {introLead}
          <span className="font-medium text-[var(--color-primary)]">
            {introEmphasis}
          </span>
          {introTrail}
        </p>

        <div
          className="relative mt-8 rounded-2xl bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-muted))]/80 px-3 py-7 md:mt-10 md:px-6 md:py-8"
          role="img"
          aria-label={scaleAria}
        >
          <div
            className="pointer-events-none absolute inset-x-6 top-1/2 h-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)]/25 via-[var(--color-secondary)]/20 to-[var(--color-accent)]/30 blur-xl md:inset-x-10"
            aria-hidden
          />
          <div className="mx-auto max-w-3xl overflow-x-auto overflow-y-hidden pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            <div className="relative flex min-h-[3.5rem] min-w-[min(100%,22rem)] items-center justify-between gap-1 px-0.5 sm:min-w-0 sm:px-2">
              <div
                className="pointer-events-none absolute left-[5%] right-[5%] top-1/2 h-3 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] shadow-[inset_0_2px_3px_rgba(255,255,255,0.45),0_2px_8px_rgb(16_58_92_/15%)] md:left-[6%] md:right-[6%]"
                aria-hidden
              />
              {LEVEL_CODES.map((code) => {
                const isC2 = code === "C2";
                return (
                  <div
                    key={code}
                    className="relative z-10 flex min-w-0 flex-1 justify-center"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] font-display text-[0.7rem] font-bold tracking-tight text-[var(--color-primary)] shadow-[0_4px_14px_-4px_rgb(16_58_92_/35%)] sm:h-11 sm:w-11 sm:text-xs md:h-12 md:w-12 ${
                        isC2
                          ? "ring-[3px] ring-[var(--color-accent)] ring-offset-[3px] ring-offset-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-muted))] shadow-[0_0_24px_-2px_rgb(240_185_50_/55%)]"
                          : "ring-1 ring-[var(--color-primary)]/12"
                      }`}
                    >
                      {code}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
