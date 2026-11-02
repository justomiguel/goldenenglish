import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { withCentrolistoMarket, type CentrolistoMarketCode } from "@/lib/pulsar/centrolistoMarket";
import { PULSAR_SEGMENT_SLUGS } from "@/lib/pulsar/pulsarSegmentSlugs";

export interface PulsarSegmentNavProps {
  locale: string;
  dict: Dictionary;
  market?: CentrolistoMarketCode;
}

export function PulsarSegmentNav({ locale, dict, market = "cl" }: PulsarSegmentNavProps) {
  const label = dict.pulsar.commercial.segmentsLabel;

  return (
    <nav aria-label={label}>
      <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {PULSAR_SEGMENT_SLUGS.map((slug) => (
          <li key={slug}>
            <Link
              href={withCentrolistoMarket(`/${locale}/para/${slug}`, market)}
              className="text-sm text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)]"
            >
              {dict.pulsar.segments[slug].navLabel}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
