import "server-only";

import { activateFreeSiteTheme } from "@/lib/pulsar/activateFreeSiteTheme";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { canTenantUseThemeKind, isExclusiveThemeKind } from "@/lib/theme/exclusiveThemeKinds";

/**
 * When staff save a shared-schema institute with an exclusive theme slug that
 * the tenant owns, switch that schema's active theme to the seeded row.
 * Generic slugs keep the free-site path. A foreign exclusive slug is ignored.
 */
export async function activateExclusiveThemeOnSave(record: {
  slug: string;
  dataMode?: string | null;
  databaseUrl?: string | null;
  postgresSchema?: string | null;
  brandThemeSlug?: string | null;
}): Promise<void> {
  const themeSlug = record.brandThemeSlug?.trim() ?? "";
  if (!isExclusiveThemeKind(themeSlug)) return;
  if (!canTenantUseThemeKind(themeSlug, record.slug)) return;
  if (record.dataMode !== "shared_schema") return;
  const databaseUrl = record.databaseUrl?.trim() ?? "";
  const schema = record.postgresSchema?.trim() ?? "";
  if (!databaseUrl || !schema) return;

  const activated = await activateFreeSiteTheme({
    databaseUrl,
    schema,
    themeSlug,
    properties: {},
  });
  if (!activated.ok) {
    logServerWarn("activateExclusiveThemeOnSave", {
      errorCode: activated.errorCode,
      slug: record.slug,
      themeSlug,
    });
  }
}
