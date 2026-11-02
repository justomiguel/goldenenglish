import type { Dictionary } from "@/types/i18n";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";
import styles from "@/components/organisms/pulsar/centrolistoMotion.module.css";

export interface PulsarHomeIdentityProps {
  dict: Dictionary;
}

export function PulsarHomeIdentity({ dict }: PulsarHomeIdentityProps) {
  const copy = dict.pulsar.commercial;

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
          {copy.identityTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-foreground)]">{copy.identityLead}</p>
        <div className="relative mt-12 grid items-end gap-6 md:grid-cols-2">
          <div className={styles.deviceLeft}>
            <PulsarBrowserShot src="/centrolisto/product/public-site.jpg" alt={copy.identitySiteCaption} />
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{copy.identitySiteCaption}</p>
          </div>
          <div className={styles.deviceRight}>
            <PulsarBrowserShot src="/centrolisto/product/admin-hub.jpg" alt={copy.identityPanelCaption} />
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{copy.identityPanelCaption}</p>
          </div>
        </div>
        <ul className="mt-8 max-w-2xl space-y-2">
          {copy.identityPoints.map((point) => (
            <li key={point} className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
