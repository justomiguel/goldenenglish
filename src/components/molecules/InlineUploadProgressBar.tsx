"use client";

import { useId } from "react";

/** Design system: image uploads MUST pair with phase labels + progress — see `.cursor/rules/01-design-system.mdc` → “Image file uploads”. */

export interface InlineUploadProgressBarProps {
  label: string;
  /** 0–100; omit when indeterminate */
  value?: number;
  indeterminate?: boolean;
  className?: string;
}

/** Inline progress for client-side file preparation + opaque server/signed uploads. */
export function InlineUploadProgressBar({
  label,
  value,
  indeterminate = false,
  className = "",
}: InlineUploadProgressBarProps) {
  const labelId = useId();
  const pct =
    !indeterminate && typeof value === "number" && Number.isFinite(value)
      ? Math.min(100, Math.max(0, Math.round(value)))
      : null;

  return (
    <div
      className={`space-y-1.5 ${className}`}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-[var(--color-foreground)]">
        <span id={labelId}>{label}</span>
        {pct !== null ? (
          <span
            className="tabular-nums text-[var(--color-muted-foreground)]"
            aria-hidden
          >
            {pct}%
          </span>
        ) : (
          <span className="text-[var(--color-muted-foreground)]" aria-hidden>
            …
          </span>
        )}
      </div>
      <progress
        className="h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--color-muted)] [&::-webkit-progress-inner-element]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--color-primary)] [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-[var(--color-primary)]"
        aria-labelledby={labelId}
        max={100}
        value={indeterminate ? undefined : pct ?? undefined}
      />
    </div>
  );
}
