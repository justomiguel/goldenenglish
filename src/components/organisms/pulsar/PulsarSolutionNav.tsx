import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { PULSAR_SOLUTION_SLUGS } from "@/lib/pulsar/pulsarSolutionSlugs";

export interface PulsarSolutionNavProps {
  locale: string;
  dict: Dictionary;
}

export function PulsarSolutionNav({ locale, dict }: PulsarSolutionNavProps) {
  return (
    <nav aria-label={dict.pulsar.solutions.sectionTitle}>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.pulsar.solutions.menuLabel}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {PULSAR_SOLUTION_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={`/${locale}/soluciones/${slug}`}
              className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            >
              {dict.pulsar.solutionSet[slug].navLabel}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={`/${locale}/precios`}
            className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
          >
            {dict.pulsar.nav.pricing}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
