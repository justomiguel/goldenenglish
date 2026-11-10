"use client";

import type { Dictionary } from "@/types/i18n";
import { useOnceInView } from "@/hooks/useOnceInView";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeChargeProps {
  dict: Dictionary;
}

export function PulsarHomeCharge({ dict }: PulsarHomeChargeProps) {
  const copy = dict.pulsar.home.house;
  const { ref, seen } = useOnceInView<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`border-t border-[var(--color-border)] lg:flex lg:min-h-[100dvh] lg:items-center ${seen ? styles.isSeen : ""}`}
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.dayLabel}</p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.dayLine}
          </h2>
        </div>
        <div className="max-w-md">
          <p className="border-b border-[var(--color-border)] py-3 text-[var(--color-foreground)]">{copy.siblingOne}</p>
          <p className="border-b border-[var(--color-border)] py-3 text-[var(--color-foreground)]">{copy.siblingTwo}</p>
          <p className="pt-4 font-medium text-[var(--color-foreground)]">{copy.chargeTotal}</p>
          <svg viewBox="0 0 320 8" className="mt-3 h-2 w-full" aria-hidden="true">
            <path
              d="M0 4 H320"
              pathLength={1}
              className={styles.chargeLine}
              stroke="var(--color-foreground)"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
