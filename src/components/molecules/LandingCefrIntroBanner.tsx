const LEVEL_CODES = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export interface LandingCefrIntroBannerProps {
  introLead: string;
  introEmphasis: string;
  introTrail: string;
  scaleAria: string;
}

/**
 * Intro copy + static visual scale (gradient path + level nodes). No client JS.
 */
export function LandingCefrIntroBanner({
  introLead,
  introEmphasis,
  introTrail,
  scaleAria,
}: LandingCefrIntroBannerProps) {
  return (
    <div className="mb-10 space-y-8 md:mb-12 md:space-y-10">
      <p className="mx-auto max-w-[65ch] text-pretty text-base leading-relaxed text-[var(--color-muted-foreground)] md:text-[1.0625rem]">
        {introLead}
        <span className="text-[var(--color-foreground)]">{introEmphasis}</span>
        {introTrail}
      </p>

      <div
        className="mx-auto max-w-3xl px-1"
        role="img"
        aria-label={scaleAria}
      >
        <div className="relative py-2">
          {/* Camino con gradiente MCER */}
          <div
            className="pointer-events-none absolute left-[6%] right-[6%] top-[calc(50%-0.5rem)] h-3 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] opacity-90 shadow-[inset_0_1px_2px_rgba(255,255,255,0.35)]"
            aria-hidden
          />
          <div className="relative grid grid-cols-6 gap-0">
            {LEVEL_CODES.map((code) => {
              const isC2 = code === "C2";
              return (
                <div
                  key={code}
                  className="flex flex-col items-center gap-2"
                >
                  <span
                    className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] font-display text-[0.65rem] font-bold tracking-tight text-[var(--color-primary)] shadow-[var(--shadow-soft)] md:h-11 md:w-11 md:text-xs ${
                      isC2
                        ? "ring-[3px] ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-background)]"
                        : "ring-1 ring-[var(--color-primary)]/15"
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
  );
}
