import Image from "next/image";
import type { Dictionary } from "@/types/i18n";
import { PulsarHousePhone } from "@/components/organisms/pulsar/PulsarHousePhone";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeTuesdayProps {
  dict: Dictionary;
}

export function PulsarHomeTuesday({ dict }: PulsarHomeTuesdayProps) {
  const copy = dict.pulsar.home.house;

  return (
    <section className="border-t border-[var(--color-border)] lg:flex lg:min-h-[100dvh] lg:items-center">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)]">{copy.tuesdayLabel}</p>
          <h2 className="mt-3 max-w-md font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.tuesdayLine}
          </h2>
          <div className="mt-8">
            <PulsarHousePhone label={copy.tuesdayLabel}>
              <ul className="space-y-2 text-sm text-[var(--color-foreground)]">
                {copy.roster.map((name) => (
                  <li key={name} className="border-b border-[var(--color-border)] pb-2">
                    {name}
                  </li>
                ))}
              </ul>
            </PulsarHousePhone>
          </div>
        </div>
        <figure className="relative aspect-[4/3] overflow-hidden rounded-[var(--layout-border-radius)]">
          <Image
            src="/centrolisto/moments/class.webp"
            alt={copy.tuesdayAlt}
            fill
            sizes="(min-width: 1024px) 36rem, 100vw"
            className={`object-cover ${styles.photoZoom}`}
          />
        </figure>
      </div>
    </section>
  );
}
