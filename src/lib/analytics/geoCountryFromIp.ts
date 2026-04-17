import "server-only";

import geoip from "geoip-country";

/**
 * Resolves an alpha-2 ISO 3166-1 country code from a raw IP string.
 * Returns the trimmed code (e.g. "AR") or `null` when the lookup is not possible
 * (private/loopback/IPv6-only ranges or unrecognised IPs). Strips any IPv4-mapped IPv6 prefix.
 */
export function resolveCountryFromIp(rawIp: string | null | undefined): string | null {
  if (!rawIp) return null;
  let t = rawIp.trim();
  if (!t) return null;
  if (t.toLowerCase().startsWith("::ffff:")) {
    t = t.slice(7);
  }
  try {
    const r = geoip.lookup(t);
    const code = r?.country?.trim();
    return code && code.length === 2 ? code.toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Picks the best available country code for a request: edge headers first
 * (Vercel / Cloudflare / generic CDN), then a server-side IP lookup as last resort.
 */
export function resolveRequestCountry(opts: {
  vercelCountry: string | null | undefined;
  cloudflareCountry: string | null | undefined;
  fallbackHeader?: string | null | undefined;
  ip: string | null | undefined;
}): string | null {
  const candidates = [opts.vercelCountry, opts.cloudflareCountry, opts.fallbackHeader];
  for (const c of candidates) {
    const t = c?.trim();
    if (t && t.length === 2 && /^[A-Za-z]{2}$/.test(t)) {
      return t.toUpperCase();
    }
  }
  return resolveCountryFromIp(opts.ip);
}
