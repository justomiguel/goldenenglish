import type { Dictionary } from "@/types/i18n";

export interface PulsarCompetitorComparisonSectionProps {
  dict: Dictionary;
}

const OTHERS = [
  { key: "schedulers", label: "colSchedulers" },
  { key: "schoolErp", label: "colSchoolErp" },
  { key: "spreadsheets", label: "colSpreadsheets" },
] as const;

export function PulsarCompetitorComparisonSection({
  dict,
}: PulsarCompetitorComparisonSectionProps) {
  const cmp = dict.pulsar.product.comparison;

  return (
    <section className="border-t border-[var(--color-border)] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {cmp.title}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {cmp.lead}
        </p>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[64rem] border-separate border-spacing-0 text-left">
            <caption className="sr-only">{cmp.title}</caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-40 bg-[var(--color-background)] px-4 py-4 text-sm font-medium text-[var(--color-muted-foreground)]"
                >
                  {cmp.colFeature}
                </th>
                <th
                  scope="col"
                  className="bg-[var(--color-primary)] px-4 py-4 text-sm font-semibold text-[var(--color-primary-foreground)]"
                >
                  {cmp.colCentroListo}
                </th>
                {OTHERS.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="bg-[var(--color-muted)] px-4 py-4 text-sm font-medium text-[var(--color-muted-foreground)]"
                  >
                    {cmp[column.label]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cmp.rows.map((row) => (
                <tr key={row.feature}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-5 align-top font-display text-base font-medium text-[var(--color-foreground)]"
                  >
                    {row.feature}
                  </th>
                  <td className="border-b border-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-background))] px-4 py-5 align-top text-base font-medium leading-relaxed text-[var(--color-foreground)]">
                    {row.centroListo}
                  </td>
                  {OTHERS.map((column) => (
                    <td
                      key={column.key}
                      className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5 align-top text-sm leading-relaxed text-[var(--color-muted-foreground)]"
                    >
                      {row[column.key]}
                    </td>
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
