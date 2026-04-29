"use client";

import { useEffect, useState } from "react";

import { computeInboxAgingVisual } from "@/lib/billing/inboxAgingVisual";

import type { Dictionary } from "@/types/i18n";

type InboxDict = Dictionary["admin"]["finance"]["inbox"];

export interface InboxAgingChipProps {
  uploadedAt: string;
  dict: InboxDict;
  /** When set (e.g. Storybook/tests), skip live clock. */
  clockNowMs?: number;
}

export function InboxAgingChip({ uploadedAt, dict, clockNowMs }: InboxAgingChipProps) {
  const [liveNowMs, setLiveNowMs] = useState<number | null>(() =>
    clockNowMs !== undefined ? clockNowMs : null,
  );

  useEffect(() => {
    if (clockNowMs !== undefined) return;
    const tick = () => setLiveNowMs(Date.now());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [clockNowMs]);

  const nowMs = clockNowMs ?? liveNowMs;

  if (nowMs === null) {
    return (
      <span
        className="inline-flex min-h-[1.25rem] min-w-[2rem] items-center rounded-full border border-[var(--color-border)] bg-[var(--color-muted)]/20 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-transparent"
        aria-hidden
      >
        ···
      </span>
    );
  }

  const { label, colorClasses } = computeInboxAgingVisual(uploadedAt, nowMs, dict);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${colorClasses}`}
    >
      {label}
    </span>
  );
}
