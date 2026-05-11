/** Builds a Google Maps search URL from a place id or free-text query. */
export function googleMapsSearchUrl(
  text: string | null | undefined,
  placeId: string | null | undefined,
): string | null {
  const p = placeId?.trim();
  const t = text?.trim();
  if (p) return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(p)}`;
  if (t) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t)}`;
  return null;
}
