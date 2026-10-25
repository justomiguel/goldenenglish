import { logServerException, logSupabaseError } from "@/lib/logging/serverActionLog";
import {
  mapDbRowToPulsarTenantRecord,
  mapTenantConfigToPulsarRecord,
  PLATFORM_TENANTS_SELECT_COLUMNS,
  type PulsarTenantRecord,
} from "@/lib/pulsar/pulsarTenantMapper";
import type { ValidatedPulsarTenantInput } from "@/lib/pulsar/pulsarTenantSchema";
import { createPulsarAdminClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";
import { listTenants, setDynamicTenantsCache } from "@/lib/tenant/tenantRegistry";

const CACHE_TTL_MS = 60_000;

let lastLoadedAt = 0;
let cachedAllRecords: PulsarTenantRecord[] | null = null;

export function invalidateTenantRegistryCache(): void {
  lastLoadedAt = 0;
  cachedAllRecords = null;
}

async function fetchPlatformTenantsFromPulsarDb(): Promise<PulsarTenantRecord[] | null> {
  try {
    const admin = createPulsarAdminClient();
    const { data, error } = await admin
      .from("platform_tenants")
      .select(PLATFORM_TENANTS_SELECT_COLUMNS)
      .order("slug", { ascending: true });
    if (error) {
      logSupabaseError("pulsarTenantStore:select_all", error);
      return null;
    }
    const records: PulsarTenantRecord[] = [];
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
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
  const records = await fetchPlatformTenantsFromPulsarDb();
  if (records && records.length > 0) {
    cachedAllRecords = records;
    lastLoadedAt = now;
    setDynamicTenantsCache(records.filter((r) => r.isEnabled));
  }
}

export async function loadAllPulsarTenantsForAdmin(): Promise<PulsarTenantRecord[]> {
  if (isPulsarSupabaseConfigured()) {
    const records = await fetchPlatformTenantsFromPulsarDb();
    if (records && records.length > 0) {
      cachedAllRecords = records;
      lastLoadedAt = Date.now();
      setDynamicTenantsCache(records.filter((r) => r.isEnabled));
      return records;
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
