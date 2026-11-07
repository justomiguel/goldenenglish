"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MarketFlag } from "@/components/atoms/MarketFlag";
import {
  CENTROLISTO_MARKETS,
  isCentrolistoMarketCode,
  writeCentrolistoMarketCookie,
  type CentrolistoMarketCode,
} from "@/lib/pulsar/centrolistoMarket";
import { trackCentrolistoGaEvent } from "@/lib/pulsar/centrolistoAnalytics";
import type { Dictionary } from "@/types/i18n";

export interface CentrolistoMarketPickerProps {
  market: CentrolistoMarketCode;
  copy: Dictionary["pulsar"]["market"];
}

export function CentrolistoMarketPicker({ market, copy }: CentrolistoMarketPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    writeCentrolistoMarketCookie(market);
  }, [market]);

  function onChange(value: string) {
    if (!isCentrolistoMarketCode(value) || value === market) return;
    writeCentrolistoMarketCookie(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("pais", value);
    trackCentrolistoGaEvent("centrolisto_market", { market: value });
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div role="radiogroup" aria-label={copy.label} className="inline-flex shrink-0 items-center gap-0.5">
      {CENTROLISTO_MARKETS.map((code) => {
        const selected = code === market;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={copy[code]}
            title={copy[code]}
            onClick={() => onChange(code)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--layout-border-radius)] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
              selected
                ? "border-[var(--color-foreground)] bg-[var(--color-muted)]"
                : "border-transparent hover:bg-[var(--color-muted)]"
            }`}
          >
            <MarketFlag code={code} />
          </button>
        );
      })}
    </div>
  );
}
