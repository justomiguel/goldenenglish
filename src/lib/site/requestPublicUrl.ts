import "server-only";
import { readRequestHostRaw, resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";
import { tenantSlugFromPulsarSubdomain } from "@/lib/tenant/pulsarSubdomain";
import {
  getPulsarHosts,
  isLocalDevHost,
  isPulsarHost,
  normalizeHost,
  PULSAR_SLUG,
  tenantPublicEnv,
} from "@/lib/tenant/tenantRegistry";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

/** Public origin for this host. Local dev keeps `http://localhost:<port>`. */
export async function getRequestPublicSiteUrl(): Promise<URL | null> {
  const rawHost = await readRequestHostRaw();
  if (rawHost && isLocalDevHost(rawHost)) {
    try {
      return new URL(`http://${rawHost}`);
    } catch {
      return new URL("http://localhost:3000");
    }
  }
  if (rawHost && isPulsarHost(rawHost)) {
    try {
      return new URL(`https://${normalizeHost(rawHost)}`);
    } catch {
      return new URL("https://centrolisto.cl");
    }
  }
  const previewSlug = rawHost
    ? tenantSlugFromPulsarSubdomain(rawHost, getPulsarHosts())
    : null;
  if (rawHost && previewSlug && previewSlug !== PULSAR_SLUG) {
    try {
      return new URL(`https://${normalizeHost(rawHost)}`);
    } catch {
      /* fall through to tenant publicUrl */
    }
  }
  const tenant = await resolveRequestTenant();
  if (tenant) {
    const origin = tenant.publicUrl ?? tenantPublicEnv(tenant).origin;
    if (origin) {
      try {
        const normalized = origin.endsWith("/") ? origin.slice(0, -1) : origin;
        return new URL(normalized);
      } catch {
        return getPublicSiteUrl();
      }
    }
  }
  return getPublicSiteUrl();
}

/** Absolute URL for a path on this request's public origin. */
export async function absoluteUrlForRequest(pathname: string): Promise<URL | null> {
  const base = await getRequestPublicSiteUrl();
  if (!base) return null;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return new URL(path, base);
}
