import type { Dictionary } from "@/types/i18n";

export interface PulsarHomePlatformProps {
  dict: Dictionary;
}

export function PulsarHomePlatform({ dict }: PulsarHomePlatformProps) {
  const copy = dict.pulsar.commercial;

  return (
    <section className="border-b border-[var(--color-border)] py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {copy.platformTitle}
        </h2>
        <ol className="mt-10 border-t border-[var(--color-border)]">
          {copy.dimensions.map((item, index) => (
            <li key={item.name} className="grid gap-2 border-b border-[var(--color-border)] py-5 sm:grid-cols-12">
              <p className="font-display text-xl text-[var(--color-foreground)] sm:col-span-3">
                <span className="mr-3 text-sm text-[var(--color-muted-foreground)]">0{index + 1}</span>
                {item.name}
              </p>
              <p className="text-base leading-relaxed text-[var(--color-foreground)] sm:col-span-9">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
