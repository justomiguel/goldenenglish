import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import {
  listProductChangelogEntries,
  resolveProductChangelogCopy,
  type ProductChangelogArea,
} from "@/lib/product-changelog/catalog";
import type { Dictionary } from "@/types/i18n";

export interface AdminProductChangelogScreenProps {
  locale: string;
  pageDict: Dictionary["dashboard"]["adminChangelogPage"];
}

function formatChangelogDate(isoDate: string, locale: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function areaLabel(
  area: ProductChangelogArea,
  areas: Dictionary["dashboard"]["adminChangelogPage"]["areas"],
): string {
  return areas[area];
}

export function AdminProductChangelogScreen({ locale, pageDict }: AdminProductChangelogScreenProps) {
  const entries = listProductChangelogEntries();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <AdminPageHeader
          title={pageDict.title}
          lead={pageDict.lead}
          iconId="changelog"
        />
      </div>
      <ol className="flex flex-col gap-3" aria-label={pageDict.listAria}>
        {entries.map((entry) => {
          const copy = resolveProductChangelogCopy(entry, locale);
          return (
            <li
              key={entry.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <time dateTime={entry.date}>{formatChangelogDate(entry.date, locale)}</time>
                <span
                  className="rounded-full bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] px-2 py-0.5 font-medium text-[var(--color-primary)]"
                >
                  {areaLabel(entry.area, pageDict.areas)}
                </span>
              </div>
              <h2 className="mt-1.5 font-display text-base font-semibold text-[var(--color-foreground)]">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {copy.summary}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
