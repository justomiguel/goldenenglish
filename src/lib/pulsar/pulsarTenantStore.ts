import { logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  mapDbRowToPulsarTenantRecord,
  mapTenantConfigToPulsarRecord,
  PLATFORM_TENANTS_SELECT_COLUMNS,
  PLATFORM_TENANTS_SELECT_WITH_DATA_PLANE,
  type PulsarTenantRecord,
} from "@/lib/pulsar/pulsarTenantMapper";
import type { ValidatedPulsarTenantInput } from "@/lib/pulsar/pulsarTenantSchema";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { mergeTenantPreviewHosts } from "@/lib/tenant/pulsarSubdomain";
import {
  getPulsarHosts,
  listTenants,
  normalizeHost,
  setDynamicPulsarHostsCache,
  setDynamicTenantsCache,
} from "@/lib/tenant/tenantRegistry";

function attachPreviewHosts(records: PulsarTenantRecord[]): PulsarTenantRecord[] {
  const pulsarHosts = getPulsarHosts();
  return records.map((record) => ({
    ...record,
    hosts: mergeTenantPreviewHosts(record.hosts, record.slug, pulsarHosts),
  }));
}

const CACHE_TTL_MS = 60_000;

let lastLoadedAt = 0;
let cachedAllRecords: PulsarTenantRecord[] | null = null;
let cachedPlatformHosts: string[] | null = null;

export function invalidateTenantRegistryCache(): void {
  lastLoadedAt = 0;
  cachedAllRecords = null;
  cachedPlatformHosts = null;
}

async function fetchPlatformSettingsHostsFromPulsarDb(): Promise<string[] | null> {
  try {
    const admin = createPulsarAdminClient();
    const { data, error } = await admin
      .from("platform_settings")
      .select("pulsar_hosts")
      .eq("id", "default")
      .maybeSingle();
    if (error) {
      logSupabaseError("pulsarTenantStore:select_settings", error);
      return null;
    }
    const rawHosts = (data as { pulsar_hosts?: unknown } | null)?.pulsar_hosts;
    if (!Array.isArray(rawHosts)) return null;
    const normalized = Array.from(
      new Set(
        rawHosts
          .filter((h): h is string => typeof h === "string")
          .map((h) => normalizeHost(h))
          .filter((h) => h.length > 0),
      ),
    );
    return normalized.length > 0 ? normalized : null;
  } catch (err) {
    logServerException("pulsarTenantStore:fetch_settings", err);
    return null;
  }
}

async function fetchPlatformTenantsFromPulsarDb(): Promise<PulsarTenantRecord[] | null> {
  try {
    const admin = createPulsarAdminClient();
    const first = await admin
      .from("platform_tenants")
      .select(PLATFORM_TENANTS_SELECT_WITH_DATA_PLANE)
      .order("slug", { ascending: true });
    let rows: unknown[] | null = first.data;
    let error = first.error;
    if (error && /data_mode|postgres_schema/i.test(error.message)) {
      const fallback = await admin
        .from("platform_tenants")
        .select(PLATFORM_TENANTS_SELECT_COLUMNS)
        .order("slug", { ascending: true });
      rows = fallback.data;
      error = fallback.error;
    }
    if (error) {
      logSupabaseError("pulsarTenantStore:select_all", error);
      return null;
    }
    const records: PulsarTenantRecord[] = [];
    for (const row of (rows ?? []) as Record<string, unknown>[]) {
      const mapped = mapDbRowToPulsarTenantRecord(row);
      if (mapped) records.push(mapped);
    }
    return records;
  } catch (err) {
    logServerException("pulsarTenantStore:fetch", err);
    return null;
  }
}

/**
 * Ensures the in-memory tenant registry is populated from Pulsar `platform_tenants`
 * when Pulsar Supabase is configured (60-second TTL). Falls back to `TENANTS_CONFIG_JSON`
 * when Pulsar Supabase is unset or empty.
 */
export async function ensureTenantRegistryLoaded(): Promise<void> {
  if (!isPulsarSupabaseConfigured()) {
    return;
  }
  const now = Date.now();
  if (cachedAllRecords !== null && now - lastLoadedAt < CACHE_TTL_MS) {
    return;
  }
  const [records, settingsHosts] = await Promise.all([
    fetchPlatformTenantsFromPulsarDb(),
    fetchPlatformSettingsHostsFromPulsarDb(),
  ]);
  if (settingsHosts && settingsHosts.length > 0) {
    cachedPlatformHosts = settingsHosts;
    setDynamicPulsarHostsCache(settingsHosts);
  }
  if (records && records.length > 0) {
    cachedAllRecords = attachPreviewHosts(records);
    lastLoadedAt = now;
    setDynamicTenantsCache(cachedAllRecords.filter((r) => r.isEnabled));
  }
}

export async function loadPulsarPlatformHostsForAdmin(): Promise<string[]> {
  if (isPulsarSupabaseConfigured()) {
    const settingsHosts = await fetchPlatformSettingsHostsFromPulsarDb();
    if (settingsHosts && settingsHosts.length > 0) {
      cachedPlatformHosts = settingsHosts;
      setDynamicPulsarHostsCache(settingsHosts);
      return settingsHosts;
    }
  }
  if (cachedPlatformHosts && cachedPlatformHosts.length > 0) {
    return cachedPlatformHosts;
  }
  return getPulsarHosts();
}

export function applyLocalMemoryPulsarHosts(hosts: readonly string[]): string[] {
  const normalized = Array.from(
    new Set(hosts.map((h) => normalizeHost(h)).filter((h) => h.length > 0)),
  );
  cachedPlatformHosts = normalized;
  setDynamicPulsarHostsCache(normalized);
  return normalized;
}

export async function loadAllPulsarTenantsForAdmin(): Promise<PulsarTenantRecord[]> {
  if (isPulsarSupabaseConfigured()) {
    const records = await fetchPlatformTenantsFromPulsarDb();
    if (records && records.length > 0) {
      cachedAllRecords = attachPreviewHosts(records);
      lastLoadedAt = Date.now();
      setDynamicTenantsCache(cachedAllRecords.filter((r) => r.isEnabled));
      return cachedAllRecords;
    }
  }
  if (cachedAllRecords && cachedAllRecords.length > 0) {
    return cachedAllRecords;
  }
  return listTenants().map(mapTenantConfigToPulsarRecord);
}

export async function loadPulsarTenantBySlugForAdmin(
  slug: string,
): Promise<PulsarTenantRecord | null> {
  const all = await loadAllPulsarTenantsForAdmin();
  return all.find((t) => t.slug === slug) ?? null;
}

/**
 * Updates the in-memory cache immediately when Pulsar DB is not yet configured in local dev,
 * so creating or editing a tenant in `/es/admin` works both with and without `PULSAR_SUPABASE_URL`.
 */
export function applyLocalMemoryTenantUpsert(input: ValidatedPulsarTenantInput): PulsarTenantRecord {
  const base = cachedAllRecords ?? listTenants().map(mapTenantConfigToPulsarRecord);
  const record: PulsarTenantRecord = {
    ...input,
    hosts: mergeTenantPreviewHosts(input.hosts, input.slug, getPulsarHosts()),
    updatedAt: new Date().toISOString(),
  };
  const next = base.some((t) => t.slug === record.slug)
    ? base.map((t) => (t.slug === record.slug ? record : t))
    : [...base, record];
  cachedAllRecords = next;
  lastLoadedAt = Date.now();
  setDynamicTenantsCache(next.filter((r) => r.isEnabled));
  return record;
}

export function applyLocalMemoryTenantRemove(slug: string): void {
  const base = cachedAllRecords ?? [];
  const next = base.filter((row) => row.slug !== slug);
  cachedAllRecords = next;
  lastLoadedAt = Date.now();
  setDynamicTenantsCache(next.filter((row) => row.isEnabled));
}
