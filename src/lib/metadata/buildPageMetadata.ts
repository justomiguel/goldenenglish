import type { Metadata } from "next";
import type { Dictionary } from "@/types/i18n";
import { getDictionary } from "@/lib/i18n/dictionaries";

/**
 * Builds page-level metadata for a dashboard route.
 *
 * Returns `{ title }` as a plain string so the root layout's template
 * (`%s | <brand>`) supplies the brand suffix without doubling it.
 * Dashboard pages are not publicly indexed, so robots are locked down here.
 *
 * Usage:
 * ```tsx
 * export async function generateMetadata({ params }) {
 *   const { locale } = await params;
 *   return buildPageMetadata(locale, (d) => d.dashboard.parentNav.progress);
 * }
 * ```
 */
export async function buildPageMetadata(
  locale: string,
  pick: (dict: Dictionary) => string,
): Promise<Metadata> {
  const dict = await getDictionary(locale);
  return {
    title: pick(dict),
    robots: { index: false, follow: false },
  };
}
