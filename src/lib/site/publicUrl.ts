import { logServerException } from "@/lib/logging/serverActionLog";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { tenantPublicEnv } from "@/lib/tenant/tenantRegistry";

function urlFromOrigin(origin: string): URL | null {
  try {
    const normalized = origin.endsWith("/") ? origin.slice(0, -1) : origin;
    return new URL(normalized);
  } catch (err) {
    logServerException("getPublicSiteUrl:tenant", err);
    return null;
  }
}

/**
 * Public site origin for canonical URLs, OG tags, sitemap (never guess in components).
 * Prefer the institute on this cron turn, then `NEXT_PUBLIC_APP_URL`, then `VERCEL_URL`.
 */
export function getPublicSiteUrl(): URL | null {
  const tenant = getAlsTenant();
  if (tenant) {
    const origin = tenant.publicUrl ?? tenantPublicEnv(tenant).origin;
    if (origin) {
      const parsed = urlFromOrigin(origin);
      if (parsed) return parsed;
    }
  }
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    try {
      const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;
      return new URL(normalized);
    } catch (err) {
      logServerException("getPublicSiteUrl:NEXT_PUBLIC_APP_URL", err);
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    try {
      return new URL(`https://${vercel}`);
    } catch (err) {
      logServerException("getPublicSiteUrl:VERCEL_URL", err);
    }
  }
  return null;
}

/** Absolute URL for a path starting with `/` (e.g. `/en/login`). */
export function absoluteUrl(pathname: string): URL | null {
  const base = getPublicSiteUrl();
  if (!base) return null;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, base);
}
