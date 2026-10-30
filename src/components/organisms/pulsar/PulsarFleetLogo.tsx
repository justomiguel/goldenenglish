"use client";

import { useState } from "react";

export interface PulsarFleetLogoProps {
  src: string | null;
  fallback: string;
}

export function PulsarFleetLogo({ src, fallback }: PulsarFleetLogoProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        aria-hidden
        className="grid h-12 w-12 shrink-0 place-items-center border border-[var(--color-border)] text-sm font-semibold text-[var(--color-foreground)]"
      >
        {fallback}
      </span>
    );
  }
  return (
    <span className="grid h-12 w-16 shrink-0 place-items-center">
      <img
        src={src}
        alt=""
        className="max-h-12 max-w-16 object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
