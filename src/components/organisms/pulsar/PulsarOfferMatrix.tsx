import type { Dictionary } from "@/types/i18n";
import { PULSAR_SOLUTION_SLUGS } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarOfferMatrixProps {
  dict: Dictionary;
}

const MARKS = ["included", "absent", "optional", "quote"] as const;

function cellLabel(dict: Dictionary, value: string): string {
  if (MARKS.includes(value as (typeof MARKS)[number])) {
    return dict.pulsar.pricing.compare.marks[value as (typeof MARKS)[number]];
  }
  return value;
}

export function PulsarOfferMatrix({ dict }: PulsarOfferMatrixProps) {
  const copy = dict.pulsar.pricing.compare;

  return (
    <section className="border-b border-[var(--color-border)] py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{dict.pulsar.pricing.compareTitle}</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">{dict.pulsar.pricing.compareTitle}</caption>
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 font-medium text-[var(--color-foreground)]">{copy.featureLabel}</th>
                {PULSAR_SOLUTION_SLUGS.map((slug) => (
                  <th key={slug} className="py-3 pr-4 font-medium text-[var(--color-foreground)]">
                    {dict.pulsar.solutionSet[slug].navLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {copy.rows.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <th scope="row" className="py-3 pr-4 font-normal text-[var(--color-foreground)]">{row.label}</th>
                  {PULSAR_SOLUTION_SLUGS.map((slug) => (
                    <td key={slug} className="py-3 pr-4 text-[var(--color-muted-foreground)]">{cellLabel(dict, row[slug])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
