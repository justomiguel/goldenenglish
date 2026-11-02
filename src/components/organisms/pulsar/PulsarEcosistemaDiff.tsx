import type { Dictionary } from "@/types/i18n";
import { PulsarBrowserShot } from "@/components/organisms/pulsar/PulsarBrowserShot";

export interface PulsarEcosistemaDiffProps {
  dict: Dictionary;
}

export function PulsarEcosistemaDiff({ dict }: PulsarEcosistemaDiffProps) {
  const item = dict.pulsar.solutionSet.ecosistema;
  const gestion = dict.pulsar.solutionSet.gestion.navLabel;

  return (
    <section className="border-b border-[var(--color-border)] py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{item.whyTitle}</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-foreground)]">{item.whyLead}</p>
        <ul className="mt-6 max-w-2xl space-y-2">
          {item.benefits.map((benefit) => (
            <li key={benefit} className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{benefit}</li>
          ))}
        </ul>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div>
            <PulsarBrowserShot src="/centrolisto/product/public-site.jpg" alt={dict.pulsar.solutions.publicSiteAlt} />
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.pulsar.commercial.identitySiteCaption}</p>
          </div>
          <div>
            <PulsarBrowserShot src="/centrolisto/product/admin-hub.jpg" alt={dict.pulsar.solutions.adminAlt} />
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{dict.pulsar.commercial.identityPanelCaption}</p>
          </div>
        </div>
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">{item.whyTitle}</caption>
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pr-4 font-medium text-[var(--color-foreground)]">{dict.pulsar.pricing.compareTitle}</th>
                <th className="py-3 pr-4 font-medium text-[var(--color-foreground)]">{gestion}</th>
                <th className="py-3 font-medium text-[var(--color-foreground)]">{item.navLabel}</th>
              </tr>
            </thead>
            <tbody>
              {dict.pulsar.pricing.compare.rows.map((row) => (
                <tr key={row.label} className="border-b border-[var(--color-border)]">
                  <th scope="row" className="py-3 pr-4 font-normal text-[var(--color-foreground)]">{row.label}</th>
                  <td className="py-3 pr-4 text-[var(--color-muted-foreground)]">{cellLabel(dict, row.gestion)}</td>
                  <td className="py-3 text-[var(--color-muted-foreground)]">{cellLabel(dict, row.ecosistema)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function cellLabel(dict: Dictionary, value: string): string {
  const marks = dict.pulsar.pricing.compare.marks;
  if (value === "included" || value === "absent" || value === "optional" || value === "quote") return marks[value];
  return value;
}
