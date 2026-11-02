import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { PULSAR_SOLUTION_SLUGS } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarSolutionNavProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarSolutionNav({ locale, dict, market = "cl" }: PulsarSolutionNavProps) {
  return (
    <nav aria-label={dict.pulsar.solutions.sectionTitle}>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.pulsar.solutions.menuLabel}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {PULSAR_SOLUTION_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={withCentrolistoMarket(`/${locale}/soluciones/${slug}`, market)}
              className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            >
              {dict.pulsar.solutionSet[slug].navLabel}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={withCentrolistoMarket(`/${locale}/precios`, market)}
            className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            {dict.pulsar.nav.pricing}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
