import type { ThemeSection } from "@/lib/design-variants/sectionVariant";

export interface VariantFleetRow {
  slug: string;
  sections: readonly ThemeSection[];
}

/** Groups tenant slugs by `variantId@major`. */
export function variantFleetSummary(rows: readonly VariantFleetRow[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    for (const section of row.sections) {
      const key = `${section.variantId}@${section.major}`;
      const slugs = grouped.get(key) ?? [];
      slugs.push(row.slug);
      grouped.set(key, slugs);
    }
  }
  return grouped;
}
