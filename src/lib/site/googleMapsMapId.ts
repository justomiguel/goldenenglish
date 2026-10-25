type GeTenantMapsPublic = { googleMapsMapId?: string };

/**
 * Vector map ID required by `AdvancedMarkerElement`.
 * Create under Google Cloud Console → Google Maps Platform → Map Management.
 * @see https://developers.google.com/maps/documentation/javascript/advanced-markers/overview
 */
export function readGoogleMapsMapId(): string {
  if (typeof window !== "undefined") {
    const bag = (window as Window & { __GE_TENANT_PUBLIC__?: GeTenantMapsPublic })
      .__GE_TENANT_PUBLIC__;
    if (bag) return bag.googleMapsMapId?.trim() || "DEMO_MAP_ID";
  }
  const id = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  if (id) return id;
  return "DEMO_MAP_ID";
}
