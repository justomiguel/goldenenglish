import type { Dictionary } from "@/types/i18n";

export interface PulsarCompetitorComparisonSectionProps {
  dict: Dictionary;
}

export function PulsarCompetitorComparisonSection({
  dict,
}: PulsarCompetitorComparisonSectionProps) {
  const cmp = dict.pulsar.product.comparison;
  const others = [
    { label: cmp.colSchedulers, key: "schedulers" as const },
    { label: cmp.colSchoolErp, key: "schoolErp" as const },
    { label: cmp.colSpreadsheets, key: "spreadsheets" as const },
  ];

  return (
    <section className="border-t border-[var(--color-border)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {cmp.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {cmp.lead}
        </p>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          <span className="font-medium text-[var(--color-primary)]">{cmp.colCentroListo}</span>
          {" · "}
          {others.map((item) => item.label).join(" · ")}
        </p>

        <div className="mt-6 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {cmp.rows.map((row) => (
            <article key={row.feature} className="grid gap-6 py-8 md:grid-cols-12 md:gap-10 md:py-10">
              <div className="md:col-span-7">
                <h3 className="font-display text-lg font-medium text-[var(--color-foreground)]">
                  {row.feature}
                </h3>
                <p className="mt-3 border-l border-[var(--color-primary)] pl-4 text-base leading-relaxed text-[var(--color-foreground)]">
                  {row.centroListo}
                </p>
              </div>
              <dl className="space-y-4 md:col-span-5">
                {others.map((item) => (
                  <div key={item.key}>
                    <dt className="text-sm font-medium text-[var(--color-foreground)]">{item.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                      {row[item.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
