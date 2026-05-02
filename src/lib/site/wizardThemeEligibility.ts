/**
 * First-run wizard persists to a single `site_themes` row.
 *
 * - Sin `SITE_BRAND_THEME_SLUG`: solo el tema con `is_active` (comportamiento original).
 * - Con slug de marca: solo la fila con ese `slug` (alineado con `loadActiveTheme` y
 *   `resolveFirstRunWizardThemeId`), aunque no esté activo.
 */
export function isThemeEligibleForInitialSiteSetup(
  existing: {
    is_active: boolean;
    slug: string;
    archived_at: string | null;
  } | null,
  brandSlug: string | null,
): boolean {
  if (!existing || existing.archived_at) return false;
  if (brandSlug) {
    return existing.slug === brandSlug;
  }
  return existing.is_active;
}
