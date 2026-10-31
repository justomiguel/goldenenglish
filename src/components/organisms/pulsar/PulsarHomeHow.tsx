import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeHowProps {
  dict: Dictionary;
}

export function PulsarHomeHow({ dict }: PulsarHomeHowProps) {
  const copy = dict.pulsar.commercial;

  return (
    <section id="como-funciona" className="border-b border-[var(--color-border)] py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.howTitle}
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {copy.howSteps.map((step, index) => (
            <li key={step.title}>
              <p className="font-display text-sm text-[var(--color-muted-foreground)]">0{index + 1}</p>
              <h3 className="mt-2 font-display text-2xl font-medium text-[var(--color-foreground)]">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--color-foreground)]">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
