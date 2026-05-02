/**
 * Optional deploy-specific theme slug (server-only). When set on a dedicated
 * Vercel project (e.g. Mozarthitos), the app resolves `site_themes` by `slug`
 * with the service role so branding overrides apply even if that row is not
 * `is_active` (the primary tenant keeps a single active row without collisions).
 */
export function getSiteBrandThemeSlug(): string | null {
  const raw = process.env.SITE_BRAND_THEME_SLUG?.trim();
  return raw && raw.length > 0 ? raw : null;
}
