"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CENTROLISTO_MARKETS,
  centrolistoMarketCookieAssignment,
  isCentrolistoMarketCode,
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
    document.cookie = centrolistoMarketCookieAssignment(market, window.location.protocol === "https:");
  }, [market]);

  function onChange(value: string) {
    if (!isCentrolistoMarketCode(value) || value === market) return;
    document.cookie = centrolistoMarketCookieAssignment(value, window.location.protocol === "https:");
    const params = new URLSearchParams(searchParams.toString());
    params.set("pais", value);
    trackCentrolistoGaEvent("centrolisto_market", { market: value });
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--color-foreground)]">
      <span className="sr-only">{copy.label}</span>
      <select
        aria-label={copy.label}
        value={market}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)]"
      >
        {CENTROLISTO_MARKETS.map((code) => (
          <option key={code} value={code}>
            {copy[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
