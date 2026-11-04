import { isLocalDevHost } from "@/lib/tenant/pulsarSubdomain";
import { normalizeHost } from "@/lib/tenant/tenantRegistry";

export const INSTITUTE_SCHEMA = /^tenant_[a-z0-9_]{1,50}$/;

/** Foreign keys in another schema that point at the institute schema. */
export const EXTERNAL_FK_SQL = `
SELECT n.nspname
FROM pg_constraint con
JOIN pg_class src ON src.oid = con.confrelid
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
JOIN pg_class dep ON dep.oid = con.conrelid
JOIN pg_namespace n ON n.oid = dep.relnamespace
WHERE con.contype = 'f'
  AND src_ns.nspname = $1
  AND n.nspname <> $1
LIMIT 1`;

/** Views in another schema that read the institute schema. */
export const EXTERNAL_VIEW_SQL = `
SELECT n.nspname
FROM pg_depend d
JOIN pg_rewrite rw ON rw.oid = d.objid
JOIN pg_class view ON view.oid = rw.ev_class
JOIN pg_namespace n ON n.oid = view.relnamespace
JOIN pg_class src ON src.oid = d.refobjid
JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
WHERE src_ns.nspname = $1
  AND n.nspname <> $1
  AND d.deptype = 'n'
LIMIT 1`;

/** Hosts this delete may remove. A platform apex or another site's host stays. */
export function exclusiveTenantHosts(input: {
  hosts: readonly string[];
  occupiedHosts: readonly string[];
  platformHosts: readonly string[];
}): string[] {
  const occupied = new Set(input.occupiedHosts.map((host) => normalizeHost(host)));
  const platform = new Set(input.platformHosts.map((host) => normalizeHost(host)));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.hosts) {
    const host = normalizeHost(raw);
    if (!host || seen.has(host) || isLocalDevHost(host)) continue;
    if (platform.has(host) || occupied.has(host)) continue;
    seen.add(host);
    out.push(host);
  }
  return out;
}

/** True only when the auth user was created for this schema. */
export function authUserBelongsToSchema(metadata: unknown, schema: string): boolean {
  if (!INSTITUTE_SCHEMA.test(schema) || !metadata || typeof metadata !== "object") return false;
  return (metadata as { tenant_schema?: unknown }).tenant_schema === schema;
}

/** Storage folder for one shared schema. Never the bucket root. */
export function sharedTenantStoragePrefix(schema: string): string | null {
  if (!INSTITUTE_SCHEMA.test(schema)) return null;
  return `${schema}/institute-public`;
}

/** Object keys under that folder. Names that climb out of the folder are skipped. */
export function storagePathsForTenant(prefix: string, names: readonly string[]): string[] {
  if (!prefix.startsWith("tenant_") || prefix.includes("..") || prefix.includes("\\")) return [];
  return names.flatMap((name) => {
    if (!name || name.includes("/") || name.includes("..") || name.includes("\\")) return [];
    return [`${prefix}/${name}`];
  });
}
