import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeIdentityProps {
  dict: Dictionary;
}

export function PulsarHomeIdentity({ dict }: PulsarHomeIdentityProps) {
  const copy = dict.pulsar.commercial;

  return (
    <section className="border-b border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)] md:text-4xl">
          {copy.identityTitle}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-foreground)]">{copy.identityLead}</p>
        <ul className="mt-6 space-y-3">
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
