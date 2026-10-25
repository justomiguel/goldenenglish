type GeTenantMapsPublic = { googleMapsApiKey?: string };

/** Browser-safe Maps key (restricted by HTTP referrer in Google Cloud). */
export function readGoogleMapsBrowserKey(): string {
  if (typeof window !== "undefined") {
    const bag = (window as Window & { __GE_TENANT_PUBLIC__?: GeTenantMapsPublic })
      .__GE_TENANT_PUBLIC__;
    if (bag) return bag.googleMapsApiKey?.trim() ?? "";
  }
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}
