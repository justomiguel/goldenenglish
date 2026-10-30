import { genericThemeSlug, isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export const FREE_SITE_LIMIT = 3;

export function canCreateFreeSite(ownedCount: number): boolean {
  return ownedCount < FREE_SITE_LIMIT;
}

/** Free sites stay on the Pulsar schema and a generic template. A custom domain is allowed. */
export function freeSiteCreateError(input: {
  ownedCount: number;
  dataMode: string;
  brandThemeSlug: string;
}): string | null {
  if (!canCreateFreeSite(input.ownedCount)) return "free_site_limit";
  if (input.dataMode !== "shared_schema") return "free_plan_shared_only";
  const kind = input.brandThemeSlug.startsWith("generic-")
    ? input.brandThemeSlug.slice("generic-".length)
    : "";
  if (!isGenericInstituteKind(kind) || input.brandThemeSlug !== genericThemeSlug(kind)) {
    return "free_plan_generic_template";
  }
  return null;
}
