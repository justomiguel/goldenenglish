import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeFaqProps {
  dict: Dictionary;
}

export function PulsarHomeFaq({ dict }: PulsarHomeFaqProps) {
  const copy = dict.pulsar.home;

  return (
    <section className="border-b border-[var(--color-border)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.faqTitle}
        </h2>
        <dl className="mt-12 max-w-2xl divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {copy.faq.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="font-display text-lg font-medium text-[var(--color-foreground)]">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
