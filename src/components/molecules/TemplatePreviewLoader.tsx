"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 180;

export function TemplatePreviewLoader({
  label,
  locale,
  complete = false,
  onDone,
}: {
  label: string;
  locale: string;
  complete?: boolean;
  onDone?: () => void;
}) {
  const [percent, setPercent] = useState(4);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!complete) return;
    const timer = window.setTimeout(() => onDoneRef.current?.(), HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [complete]);

  useEffect(() => {
    if (complete) return;
    const started = performance.now();
    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 80) {
        last = now;
        const seconds = (now - started) / 1000;
        const next = Math.min(92, Math.round(4 + 88 * (1 - Math.exp(-seconds / 1.6))));
        setPercent(next);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [complete]);

  const shownPercent = complete ? 100 : percent;
  const safeLocale = locale === "en" || locale === "pt" ? locale : "es";
  const percentLabel = new Intl.NumberFormat(safeLocale, {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(shownPercent / 100);

  return (
    <div
      className="flex h-full min-h-48 flex-col items-center justify-center gap-3 bg-[var(--color-background)] px-6 text-[var(--color-foreground)]"
      role="status"
      aria-live="polite"
      aria-busy={shownPercent < 100}
    >
      <p className="text-sm">{label}</p>
      <p className="text-3xl font-medium tabular-nums">{percentLabel}</p>
      <div
        className="h-1.5 w-full max-w-xs overflow-hidden bg-[var(--color-muted)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={shownPercent}
        aria-label={label}
      >
        <div className="h-full bg-[var(--color-primary)]" style={{ width: `${shownPercent}%` }} />
      </div>
    </div>
  );
}
