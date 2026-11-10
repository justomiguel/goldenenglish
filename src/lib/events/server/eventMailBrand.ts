import "server-only";

import { brandPublicFromProperties, type BrandPublic } from "@/lib/brand/server";
import { hideUnsetGenericContact } from "@/lib/theme/genericPublicProperties";
import { loadActiveThemeForSlug } from "@/lib/theme/loadActiveTheme";
import { mergeProperties } from "@/lib/theme/themeOverrides";
import { loadProperties } from "@/lib/theme/themeParser";
import { getTenantBySlug } from "@/lib/tenant/tenantRegistry";

export async function brandFrameForSlug(
  slug: string,
): Promise<{ brand: BrandPublic; origin: string } | null> {
  const tenant = getTenantBySlug(slug);
  if (!tenant) return null;
  const defaults = loadProperties();
  const active = await loadActiveThemeForSlug(slug);
  const properties = active
    ? hideUnsetGenericContact(
        mergeProperties(defaults, active.theme.properties),
        active.theme.properties,
        active.theme.templateKind,
      )
    : defaults;
  const host = tenant.hosts.find((item) => item.trim().length > 0);
  const origin = tenant.publicUrl ?? (host ? `https://${host}` : "http://localhost:3000");
  return { brand: brandPublicFromProperties(properties, tenant.supabaseUrl), origin };
}

export function eventEntryMailSlug(entryHostSlug: unknown): string | null {
  if (typeof entryHostSlug !== "string") return null;
  const slug = entryHostSlug.trim();
  return slug.length > 0 ? slug : null;
}
