import { normalizeHost } from "./parseTenantConfigJson";

export function isBareLocalDevHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "[::1]" ||
    normalized === "::1"
  );
}

export function isLocalDevHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return isBareLocalDevHost(normalized) || normalized.endsWith(".localhost");
}

export const RESERVED_PULSAR_SUBDOMAIN_LABELS = new Set(["www", "pulsar"]);

function pulsarApexSuffixes(pulsarHosts: readonly string[]): Set<string> {
  const suffixes = new Set<string>();
  for (const raw of pulsarHosts) {
    const host = normalizeHost(raw);
    if (!host) continue;
    suffixes.add(host);
    if (host.startsWith("www.")) suffixes.add(host.slice(4));
  }
  return suffixes;
}

/**
 * First label when Host is `{slug}.localhost` or `{slug}.{pulsar-apex}`.
 * Returns `pulsar` for the platform subdomain. Null when the host is an apex,
 * a custom institute domain, or not this pattern.
 */
export function tenantSlugFromPulsarSubdomain(
  host: string | null | undefined,
  pulsarHosts: readonly string[],
): string | null {
  if (!host) return null;
  const normalized = normalizeHost(host);
  if (!normalized || !normalized.includes(".")) return null;

  if (normalized.endsWith(".localhost")) {
    const label = normalized.slice(0, -".localhost".length);
    if (!label || label.includes(".")) return null;
    if (RESERVED_PULSAR_SUBDOMAIN_LABELS.has(label) && label !== "pulsar") return null;
    return label;
  }

  const suffixes = pulsarApexSuffixes(pulsarHosts);
  if (suffixes.has(normalized)) return null;

  for (const suffix of suffixes) {
    const prefix = `.${suffix}`;
    if (!normalized.endsWith(prefix)) continue;
    const label = normalized.slice(0, -prefix.length);
    if (!label || label.includes(".")) return null;
    if (RESERVED_PULSAR_SUBDOMAIN_LABELS.has(label) && label !== "pulsar") return null;
    return label;
  }
  return null;
}

export function pulsarPreviewApexes(pulsarHosts: readonly string[]): string[] {
  const apexes: string[] = [];
  const seen = new Set<string>();
  for (const raw of pulsarHosts) {
    const host = normalizeHost(raw);
    if (!host || host === "localhost" || host.endsWith(".localhost")) continue;
    const apex = host.startsWith("www.") ? host.slice(4) : host;
    if (!apex || seen.has(apex)) continue;
    seen.add(apex);
    apexes.push(apex);
  }
  return apexes;
}

export function previewHostsForTenantSlug(
  slug: string,
  pulsarHosts: readonly string[],
): string[] {
  const label = slug.trim().toLowerCase();
  if (!label || RESERVED_PULSAR_SUBDOMAIN_LABELS.has(label)) return [];
  return pulsarPreviewApexes(pulsarHosts).map((apex) => `${label}.${apex}`);
}

export function mergeTenantPreviewHosts(
  hosts: readonly string[],
  slug: string,
  pulsarHosts: readonly string[],
): string[] {
  return Array.from(
    new Set([
      ...hosts.map((host) => normalizeHost(host)).filter((host) => host.length > 0),
      ...previewHostsForTenantSlug(slug, pulsarHosts),
    ]),
  );
}
