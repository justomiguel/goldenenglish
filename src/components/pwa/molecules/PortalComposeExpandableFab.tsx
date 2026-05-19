"use client";

import type { LucideIcon } from "lucide-react";
import { useCallback, useState } from "react";

export interface PortalComposeExpandableFabProps {
  label: string;
  onClick: () => void;
  Icon: LucideIcon;
  /** Tailwind bottom offset (fixed FAB sits above parent tab bar by default). */
  bottomClassName?: string;
}

/**
 * Extended FAB (Material-style): icon-only at rest; label expands on hover, focus, or pointer hover (touch).
 * Pattern aligned with {@link AdminCommandPalette} fixed FAB; animations use project `animate-fade-up`.
 */
export function PortalComposeExpandableFab({
  label,
  onClick,
  Icon,
  bottomClassName = "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
}: PortalComposeExpandableFabProps) {
  const [labelRevealed, setLabelRevealed] = useState(false);

  const revealLabel = useCallback(() => setLabelRevealed(true), []);
  const hideLabel = useCallback(() => setLabelRevealed(false), []);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      onPointerEnter={revealLabel}
      onPointerLeave={hideLabel}
      onFocus={revealLabel}
      onBlur={hideLabel}
      className={[
        "group/fab fixed right-4 z-[55] inline-flex h-14 min-w-14 items-center justify-center overflow-hidden rounded-full",
        "border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))]",
        "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-card)]",
        "w-14 gap-0 px-0",
        "transition-[width,padding-inline,gap,box-shadow,transform] duration-300 ease-out",
        "motion-safe:animate-fade-up motion-reduce:transition-none motion-reduce:animate-none",
        "hover:w-auto hover:max-w-[min(calc(100vw-2rem),18rem)] hover:gap-2 hover:px-4",
        "hover:shadow-[0_8px_28px_color-mix(in_oklch,var(--color-primary)_35%,transparent)] hover:opacity-95",
        "focus-visible:w-auto focus-visible:max-w-[min(calc(100vw-2rem),18rem)] focus-visible:gap-2 focus-visible:px-4",
        "focus-visible:shadow-[0_8px_28px_color-mix(in_oklch,var(--color-primary)_35%,transparent)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2",
        "active:scale-[0.97]",
        labelRevealed
          ? "w-auto max-w-[min(calc(100vw-2rem),18rem)] gap-2 px-4 shadow-[0_8px_28px_color-mix(in_oklch,var(--color-primary)_35%,transparent)]"
          : "",
        bottomClassName,
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
      <span
        className={[
          "overflow-hidden whitespace-nowrap text-sm font-semibold leading-none",
          "max-w-0 opacity-0 transition-[max-width,opacity] duration-300 ease-out motion-reduce:transition-none",
          "group-hover/fab:max-w-[12rem] group-hover/fab:opacity-100",
          "group-focus-visible/fab:max-w-[12rem] group-focus-visible/fab:opacity-100",
          labelRevealed ? "max-w-[12rem] opacity-100" : "",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}
