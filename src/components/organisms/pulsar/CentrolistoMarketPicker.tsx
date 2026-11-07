"use client";

import { useEffect, useId, useRef, useState } from "react";
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
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    writeCentrolistoMarketCookie(market);
  }, [market]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onChange(value: string) {
    setOpen(false);
    if (!isCentrolistoMarketCode(value) || value === market) return;
    writeCentrolistoMarketCookie(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("pais", value);
    trackCentrolistoGaEvent("centrolisto_market", { market: value });
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        role="combobox"
        aria-label={copy.label}
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--layout-border-radius)] px-2 text-xs text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <MarketFlag code={market} />
        <span>{copy[market]}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={copy.label}
          className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] py-1"
        >
          {CENTROLISTO_MARKETS.map((code) => {
            const selected = code === market;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onChange(code)}
                  className={`flex min-h-11 w-full items-center gap-2 px-2 text-xs text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] ${
                    selected ? "bg-[var(--color-muted)]" : ""
                  }`}
                >
                  <MarketFlag code={code} />
                  <span>{copy[code]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
