export interface EspacioZenitHeroSplashProps {
  /** `left` = cyan splash; `right` = pink splash (mirrors layout). */
  variant: "left" | "right";
}

const MAIN_SPLASH_D =
  "M450 350 C380 220 250 260 200 200 C300 330 120 380 60 450 C220 420 300 470 380 390 C450 520 600 500 720 430 C600 420 540 340 450 350Z";

/**
 * Hero splash: radial gradient + noise + glow (defs). Colors swap by `variant`.
 */
export function EspacioZenitHeroSplash({ variant }: EspacioZenitHeroSplashProps) {
  const sid = variant === "left" ? "ez-splash-l" : "ez-splash-r";
  const gradId = `${sid}-rad`;
  const noiseId = `${sid}-noise`;
  const glowId = `${sid}-glow`;

  const isCyan = variant === "left";
  const gStops = isCyan
    ? { s0: "#a8eeff", s60: "#00aeef", s100: "#006f9e" }
    : { s0: "#ff7ab8", s60: "#ff4da0", s100: "#e60073" };
  const accent = isCyan ? "#00aeef" : "#ff5fa2";

  return (
    <svg
      className="ez-mock-hero-splash-svg"
      viewBox="0 0 900 700"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gStops.s0} />
          <stop offset="60%" stopColor={gStops.s60} />
          <stop offset="100%" stopColor={gStops.s100} />
        </radialGradient>
        <filter id={noiseId} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
        </filter>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g fill={`url(#${gradId})`} filter={`url(#${noiseId})`}>
        <path d={MAIN_SPLASH_D} />
      </g>

      <g fill={accent} opacity={0.85}>
        <path d="M480 320 L820 120 L520 360Z" />
        <path d="M460 380 L780 560 L500 400Z" />
        <path d="M380 360 L120 200 L360 400Z" />
        <path d="M400 400 L180 650 L440 420Z" />
      </g>

      <g fill={accent}>
        <circle cx="150" cy="230" r="16" />
        <circle cx="720" cy="160" r="12" />
        <circle cx="780" cy="520" r="18" />
        <circle cx="210" cy="540" r="11" />
        <circle cx="650" cy="410" r="9" />
      </g>

      <g fill={`url(#${gradId})`} opacity={0.4} filter={`url(#${glowId})`}>
        <path d={MAIN_SPLASH_D} />
      </g>
    </svg>
  );
}
