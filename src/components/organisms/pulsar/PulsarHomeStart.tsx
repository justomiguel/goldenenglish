import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeStartProps {
  dict: Dictionary;
}

export function PulsarHomeStart({ dict }: PulsarHomeStartProps) {
  const copy = dict.pulsar.home;

  return (
    <section className="border-b border-[var(--color-border)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.startTitle}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {copy.startLead}
        </p>
        <ol className="mt-12 max-w-2xl border-l border-[var(--color-primary)]">
          {dict.pulsar.contact.steps.map((step) => (
            <li key={step.step} className="py-6 pl-6">
              <p className="font-display text-sm text-[var(--color-accent)]">{step.step}</p>
              <h3 className="mt-2 font-display text-xl font-medium text-[var(--color-foreground)]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
