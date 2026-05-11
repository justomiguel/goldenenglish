/**
 * New Places (Place class) may expose `id` as `places/ChIJ…`; Geocoder, Maps URLs, and our DB
 * expect the canonical token without the `places/` resource prefix.
 */
export function normalizeGooglePlaceIdForStorage(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return t.startsWith("places/") ? t.slice("places/".length) || null : t;
}
