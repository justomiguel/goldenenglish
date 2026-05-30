"use client";

import { Languages } from "lucide-react";

interface BlogTranslateButtonProps {
  label: string;
  disabledLabel?: string;
  disabled?: boolean;
  onClick: () => void | Promise<void>;
}

export function BlogTranslateButton({
  label,
  disabledLabel,
  disabled,
  onClick,
}: BlogTranslateButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] disabled:opacity-70"
      disabled={disabled}
      title={disabled ? disabledLabel : undefined}
      onClick={() => {
        void onClick();
      }}
    >
      <Languages aria-hidden className="h-4 w-4" />
      {label}
    </button>
  );
}
