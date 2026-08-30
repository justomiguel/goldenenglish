import type { Locale } from "@/types/i18n";
import { PRODUCT_CHANGELOG_ENTRIES } from "@/lib/product-changelog/catalogEntries";
import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";

export {
  PRODUCT_CHANGELOG_AREAS,
  changelogT,
  type ProductChangelogArea,
  type LocalizedChangelogText,
  type ProductChangelogEntry,
} from "@/lib/product-changelog/catalogTypes";

export function listProductChangelogEntries(): ProductChangelogEntry[] {
  return PRODUCT_CHANGELOG_ENTRIES.map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      if (a.entry.date !== b.entry.date) return a.entry.date < b.entry.date ? 1 : -1;
      return a.index - b.index;
    })
    .map(({ entry }) => entry);
}

export function resolveProductChangelogCopy(
  entry: ProductChangelogEntry,
  locale: Locale | string,
): { title: string; summary: string } {
  const key = locale === "en" || locale === "pt" ? locale : "es";
  return { title: entry.title[key], summary: entry.summary[key] };
}
