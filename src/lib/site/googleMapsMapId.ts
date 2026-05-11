/**
 * Vector map ID required by `AdvancedMarkerElement`.
 * Create under Google Cloud Console → Google Maps Platform → Map Management.
 * @see https://developers.google.com/maps/documentation/javascript/advanced-markers/overview
 */
export function readGoogleMapsMapId(): string {
  const id = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  if (id) return id;
  return "DEMO_MAP_ID";
}
