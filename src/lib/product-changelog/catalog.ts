import type { Locale } from "@/types/i18n";
import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";

export {
  PRODUCT_CHANGELOG_AREAS,
  type ProductChangelogArea,
  type LocalizedChangelogText,
  type ProductChangelogEntry,
} from "@/lib/product-changelog/catalogTypes";

export function resolveProductChangelogCopy(
  entry: ProductChangelogEntry,
  locale: Locale | string,
): { title: string; summary: string } {
  const key = locale === "en" || locale === "pt" ? locale : "es";
  return { title: entry.title[key], summary: entry.summary[key] };
}
