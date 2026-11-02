import type { Dictionary } from "@/types/i18n";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";

export interface PulsarGestionUsesProps {
  dict: Dictionary;
}

export function PulsarGestionUses({ dict }: PulsarGestionUsesProps) {
  const item = dict.pulsar.solutionSet.gestion;

  return (
    <section className="border-b border-[var(--color-border)] py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <PulsarBrowserShot src="/centrolisto/product/admin-hub.jpg" alt={dict.pulsar.solutions.adminAlt} />
        <div>
          <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{item.usesTitle}</h2>
          <ol className="mt-6 space-y-4">
            {item.benefits.map((benefit, index) => (
              <li key={benefit} className="text-base leading-relaxed text-[var(--color-foreground)]">
                <span className="mr-2 font-display text-sm text-[var(--color-muted-foreground)]">0{index + 1}</span>
                {benefit}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm font-medium text-[var(--color-foreground)]">{item.capLine}</p>
        </div>
      </div>
    </section>
  );
}
