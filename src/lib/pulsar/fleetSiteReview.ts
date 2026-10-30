import { isBrandDataMigration } from "@/lib/tenant/planInstituteMigrationApplies";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";
import { normalizeHost } from "@/lib/tenant/tenantRegistry";
import { customHostBesidePreview, domainDnsRecord } from "@/lib/pulsar/ownerSiteLinks";

export type FleetVercelState = "none" | "skipped" | "attached" | "missing" | "failed";
export type FleetMigrationState = "current" | "behind" | "unknown";

export type FleetHostFact = {
  host: string;
  role: "preview" | "custom";
  dnsKind: "cname" | "a" | null;
  dnsName: string;
  dnsTarget: string;
  vercel: FleetVercelState;
};

export type FleetSiteReview = {
  dataMode: "project" | "shared_schema";
  schemaName: string;
  migrationHead: string;
  migrationApplied: string | null;
  migrationState: FleetMigrationState;
  hosts: FleetHostFact[];
  ownerEmail: string | null;
  ownerUsed: number | null;
};

const MIGRATION_FILE = /^\d+_.+\.sql$/;

export function migrationRank(name: string): number {
  const match = /^(\d+)/.exec(name);
  return match ? Number(match[1]) : 0;
}

export function latestMigrationName(names: readonly string[]): string | null {
  let best: string | null = null;
  let rank = -1;
  for (const name of names) {
    const next = migrationRank(name);
    if (next > rank) {
      rank = next;
      best = name;
    }
  }
  return best;
}

export function productMigrationHead(fileNames: readonly string[]): string {
  const product = fileNames.filter(
    (name) => MIGRATION_FILE.test(name) && !isBrandDataMigration(name),
  );
  return latestMigrationName(product) ?? "";
}

export function migrationReviewState(applied: string | null, head: string): FleetMigrationState {
  if (!head || !applied) return "unknown";
  return migrationRank(applied) >= migrationRank(head) ? "current" : "behind";
}

export function chooseAppliedMigration(
  ledgerVersions: readonly string[],
  markerVersion: string | null,
): string | null {
  const names = ledgerVersions.filter((name) => !isBrandDataMigration(name));
  if (markerVersion) names.push(markerVersion);
  return latestMigrationName(names);
}

/** `233_*.sql` counts as applied when that seed row exists and the ledger is older. */
export function markerVersionForGenericTheme(
  fileNames: readonly string[],
  genericThemePresent: boolean,
): string | null {
  if (!genericThemePresent) return null;
  return fileNames.find((name) => name.startsWith("233_")) ?? null;
}

export function instituteLogoUrl(path: string, origin: string): string | null {
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = origin.trim().replace(/\/$/, "");
  if (!base) return null;
  const sep = trimmed.startsWith("/") ? "" : "/";
  return `${base}${sep}${trimmed}`;
}

const LANDING_MEDIA_BUCKET = "landing-media";

/** Prefer a file this app can serve. Fall back to the institute site or Storage. */
export function chooseFleetLogo(input: {
  rawPath: string;
  origin: string;
  supabaseUrl: string;
  localExact: boolean;
  localFallback: string | null;
}): string | null {
  const raw = input.rawPath.trim();
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw && !raw.startsWith("/")) {
    const base = input.supabaseUrl.trim().replace(/\/+$/, "");
    if (!base) return input.localFallback;
    const encoded = raw
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${base}/storage/v1/object/public/${LANDING_MEDIA_BUCKET}/${encoded}`;
  }
  if (raw.startsWith("/") && input.localExact) return raw;
  if (input.localFallback) return input.localFallback;
  if (raw.startsWith("/")) return instituteLogoUrl(raw, input.origin);
  return null;
}

export function vercelCustomStatus(input: {
  customHost: string;
  tokenConfigured: boolean;
  names: readonly string[] | null;
}): FleetVercelState {
  if (!input.customHost) return "none";
  if (!input.tokenConfigured) return "skipped";
  if (!input.names) return "failed";
  const wanted = normalizeHost(input.customHost);
  return input.names.some((name) => normalizeHost(name) === wanted) ? "attached" : "missing";
}

export function buildFleetSiteReview(input: {
  dataMode?: "project" | "shared_schema";
  postgresSchema?: string | null;
  hosts: readonly string[];
  slug: string;
  platformHosts: readonly string[];
  migrationHead: string;
  ledgerVersions: readonly string[];
  markerVersion: string | null;
  vercelNames: readonly string[] | null;
  vercelConfigured: boolean;
  ownerEmail: string | null;
  ownerUsed: number | null;
}): FleetSiteReview {
  const dataMode = input.dataMode === "shared_schema" ? "shared_schema" : "project";
  const schemaName =
    dataMode === "shared_schema" ? input.postgresSchema?.trim() || "public" : "public";
  const applied = chooseAppliedMigration(input.ledgerVersions, input.markerVersion);
  const preview = new Set(previewHostsForTenantSlug(input.slug, input.platformHosts));
  const custom = customHostBesidePreview(input.hosts, [...preview]);
  const hosts = input.hosts.map((host) => normalizeHost(host)).filter((host) => host.length > 0);
  const facts: FleetHostFact[] = hosts.slice(0, 4).map((host) => {
    const role = preview.has(host) ? "preview" : "custom";
    const dns = domainDnsRecord(host);
    const vercel =
      role === "preview"
        ? "none"
        : vercelCustomStatus({
            customHost: host === custom ? custom : host,
            tokenConfigured: input.vercelConfigured,
            names: input.vercelNames,
          });
    return {
      host,
      role,
      dnsKind: dns?.kind ?? null,
      dnsName: dns?.name ?? "",
      dnsTarget: dns?.target ?? "",
      vercel,
    };
  });
  return {
    dataMode,
    schemaName,
    migrationHead: input.migrationHead,
    migrationApplied: applied,
    migrationState: migrationReviewState(applied, input.migrationHead),
    hosts: facts,
    ownerEmail: input.ownerEmail,
    ownerUsed: input.ownerEmail ? input.ownerUsed : null,
  };
}
