import { locales } from "@/lib/i18n/dictionaries";

/** Request header set by middleware on the Pulsar theme editor. */
export const GE_PULSAR_THEME_SLUG_HEADER = "x-ge-pulsar-theme-slug";

const SLUG = "[a-z0-9](?:[a-z0-9-]{0,62})?";

export function pulsarThemeSlugFromPath(pathname: string): string | null {
  const match = pathname.match(
    new RegExp(
      `^\\/(?:${locales.join("|")})\\/admin\\/tenants\\/(${SLUG})\\/theme(?:\\/|$)`,
    ),
  );
  return match?.[1] ?? null;
}
