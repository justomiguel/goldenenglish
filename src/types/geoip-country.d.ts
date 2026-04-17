/**
 * Minimal type stub for the `geoip-country` CommonJS package (no shipped d.ts).
 * We only consume `lookup(ip)` returning the alpha-2 country code, so the rest
 * of the record is typed loosely.
 */
declare module "geoip-country" {
  export interface GeoIpCountryResult {
    country: string;
    name?: string;
    native?: string;
    phone?: number[];
    continent?: string;
    capital?: string;
    currency?: string[];
    languages?: string[];
    continent_name?: string;
  }

  export function lookup(ip: string): GeoIpCountryResult | null;

  const _default: { lookup: typeof lookup };
  export default _default;
}
