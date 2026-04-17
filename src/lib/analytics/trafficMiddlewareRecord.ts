import { locales } from "@/lib/i18n/dictionaries";

const localeSet = new Set<string>(locales);

/**
 * Whether this request should append one row to `traffic_page_hits`.
 * Skips non-GET, non-locale HTML traffic, and Next.js link prefetch requests
 * so totals stay aligned with real navigations (not hover-prefetch storms).
 */
export function shouldRecordPublicTrafficHit(opts: {
  method: string;
  pathname: string;
  getHeader: (name: string) => string | null;
}): boolean {
  if (opts.method !== "GET") return false;
  const p = opts.pathname;
  if (!p.startsWith("/") || p.includes("..")) return false;
  const seg = p.split("/")[1];
  if (!seg || !localeSet.has(seg)) return false;
  if (p.startsWith("/_next")) return false;
  const h = opts.getHeader;
  if ((h("next-router-prefetch") ?? "").trim() === "1") return false;
  if ((h("sec-purpose") ?? "").toLowerCase() === "prefetch") return false;
  return true;
}
