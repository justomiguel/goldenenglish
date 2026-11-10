"use client";

import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { useOnceInView } from "@/hooks/useOnceInView";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeSundayProps {
  dict: Dictionary;
}

export function PulsarHomeSunday({ dict }: PulsarHomeSundayProps) {
  const copy = dict.pulsar.home.house;
  const { ref, seen } = useOnceInView<HTMLElement>();

  return (
    <section ref={ref} className="border-t border-[var(--color-border)] lg:flex lg:min-h-[100dvh] lg:items-center">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.sundayLabel}</p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.sundayLine}
          </h2>
        </div>
        <div className={`relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] ${seen ? styles.isSeen : ""}`}>
          <Image
            src="/centrolisto/clients/espaciozenit.jpg"
            alt={copy.siteAlt}
            fill
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="object-cover"
          />
          <div className={`${styles.seatOpen} absolute inset-x-4 bottom-4 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)]`}>
            {copy.sundaySeat}
          </div>
          <div className={`${styles.seatTaken} absolute inset-x-4 bottom-4 rounded-[var(--layout-border-radius)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)]`}>
            <p>{copy.sundayTaken}</p>
            <p className="mt-1">{copy.sundayRow}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
