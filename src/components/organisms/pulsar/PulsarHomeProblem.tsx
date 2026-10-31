import type { Dictionary } from "@/types/i18n";

export interface PulsarHomeProblemProps {
  dict: Dictionary;
}

export function PulsarHomeProblem({ dict }: PulsarHomeProblemProps) {
  const copy = dict.pulsar.commercial;

  return (
    <section className="border-b border-[var(--color-border)] py-14 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="max-w-xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
            {copy.problemTitle}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-foreground)]">{copy.problemLead}</p>
        </div>
        <ul className="space-y-3 lg:col-span-5 lg:pt-2">
          {copy.problems.map((item) => (
            <li
              key={item}
              className="border-t border-[var(--color-border)] pt-3 text-base text-[var(--color-foreground)]"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
