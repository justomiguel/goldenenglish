import type { CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";

interface MarketFlagProps {
  code: CentrolistoMarketCode;
  className?: string;
}

/** National colors for the CentroListo country control. Same exception as LocaleFlag. */
export function MarketFlag({ code, className = "" }: MarketFlagProps) {
  const box = `inline-flex h-4 w-6 shrink-0 overflow-hidden rounded-[2px] ${className}`;

  if (code === "cl") {
    return (
      <span className={box} aria-hidden>
        <svg viewBox="0 0 6 4" className="size-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="6" height="2" fill="#FFFFFF" />
          <rect y="2" width="6" height="2" fill="#D52B1E" />
          <rect width="2.2" height="2" fill="#0039A6" />
          <polygon
            fill="#FFFFFF"
            points="1.1,0.28 1.28,0.82 1.84,0.82 1.39,1.15 1.56,1.7 1.1,1.38 0.64,1.7 0.81,1.15 0.36,0.82 0.92,0.82"
          />
        </svg>
      </span>
    );
  }

  if (code === "uy") {
    return (
      <span className={box} aria-hidden>
        <svg viewBox="0 0 9 6" className="size-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="9" height="6" fill="#FFFFFF" />
          <rect y="0.67" width="9" height="0.66" fill="#0038A8" />
          <rect y="2" width="9" height="0.66" fill="#0038A8" />
          <rect y="3.33" width="9" height="0.66" fill="#0038A8" />
          <rect y="4.67" width="9" height="0.66" fill="#0038A8" />
          <rect width="3.6" height="3.2" fill="#FFFFFF" />
          <circle cx="1.8" cy="1.6" r="0.7" fill="#FCD116" />
        </svg>
      </span>
    );
  }

  if (code === "py") {
    return (
      <span className={box} aria-hidden>
        <svg viewBox="0 0 3 2" className="size-full" xmlns="http://www.w3.org/2000/svg">
          <rect width="3" height="0.67" fill="#D52B1E" />
          <rect y="0.67" width="3" height="0.66" fill="#FFFFFF" />
          <rect y="1.33" width="3" height="0.67" fill="#0038A8" />
        </svg>
      </span>
    );
  }

  return (
    <span className={box} aria-hidden>
      <svg viewBox="0 0 3 2" className="size-full" xmlns="http://www.w3.org/2000/svg">
        <rect width="3" height="0.67" fill="#74ACDF" />
        <rect y="0.67" width="3" height="0.66" fill="#FFFFFF" />
        <rect y="1.33" width="3" height="0.67" fill="#74ACDF" />
      </svg>
    </span>
  );
}
