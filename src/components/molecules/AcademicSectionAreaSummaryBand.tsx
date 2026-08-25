import type { ReactNode } from "react";

export interface AcademicSectionAreaSummaryBandProps {
  children: ReactNode;
  /** Accessible name when the band has no visible heading. */
  ariaLabel?: string;
  /** When inner content exposes a visible heading id. */
  ariaLabelledBy?: string;
}

export function AcademicSectionAreaSummaryBand({
  children,
  ariaLabel,
  ariaLabelledBy,
}: AcademicSectionAreaSummaryBandProps) {
  return (
    <div
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]"
    >
      {children}
    </div>
  );
}
