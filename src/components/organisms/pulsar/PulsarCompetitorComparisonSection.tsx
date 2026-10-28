import type { Dictionary } from "@/types/i18n";

export interface PulsarCompetitorComparisonSectionProps {
  dict: Dictionary;
}

export function PulsarCompetitorComparisonSection({
  dict,
}: PulsarCompetitorComparisonSectionProps) {
  const cmp = dict.pulsar.product.comparison;

  return (
    <section className="border-t border-[var(--color-border)] py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="font-display text-sm italic text-[var(--color-muted-foreground)]">
          {cmp.eyebrow}
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">
          {cmp.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
          {cmp.lead}
        </p>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-4 pr-6 font-medium text-[var(--color-foreground)]">
                  {cmp.colFeature}
                </th>
                <th className="py-4 pr-6 font-display text-[var(--color-primary)]">
                  {cmp.colCentroListo}
                </th>
                <th className="py-4 pr-6 font-medium text-[var(--color-muted-foreground)]">
                  {cmp.colSchedulers}
                </th>
                <th className="py-4 pr-6 font-medium text-[var(--color-muted-foreground)]">
                  {cmp.colSchoolErp}
                </th>
                <th className="py-4 font-medium text-[var(--color-muted-foreground)]">
                  {cmp.colSpreadsheets}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {cmp.rows.map((row) => (
                <tr key={row.feature}>
                  <td className="py-4 pr-6 text-[var(--color-foreground)]">{row.feature}</td>
                  <td className="py-4 pr-6 text-[var(--color-foreground)]">{row.centroListo}</td>
                  <td className="py-4 pr-6 text-[var(--color-muted-foreground)]">{row.schedulers}</td>
                  <td className="py-4 pr-6 text-[var(--color-muted-foreground)]">{row.schoolErp}</td>
                  <td className="py-4 text-[var(--color-muted-foreground)]">{row.spreadsheets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
