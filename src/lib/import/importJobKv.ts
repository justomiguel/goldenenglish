/**
 * Vercel KV (REST). Package `@vercel/kv` is deprecated in favor of Marketplace Redis;
 * env vars KV_REST_API_URL / KV_REST_API_TOKEN still work when linked from Vercel.
 */
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { preferSharedPlatformSecret } from "@/lib/tenant/preferTenantValue";
import { isMultiTenantEnabled, type TenantConfig } from "@/lib/tenant/tenantRegistry";
import type { ImportJobState, MergeImportJobPatch } from "@/types/importJob";

export type { ImportJobState, ImportJobStatus, MergeImportJobPatch } from "@/types/importJob";

const KEY_PREFIX = "import:job:";
const TTL_SEC = 3600;

function kvCredentials(tenant?: TenantConfig | null): { url: string; token: string } {
  const active = tenant ?? getAlsTenant();
  return {
    url: preferSharedPlatformSecret(
      Boolean(active),
      active?.kvRestApiUrl,
      process.env.KV_REST_API_URL,
    ),
    token: preferSharedPlatformSecret(
      Boolean(active),
      active?.kvRestApiToken,
      process.env.KV_REST_API_TOKEN,
    ),
  };
}

export function isKvImportConfigured(tenant?: TenantConfig | null): boolean {
  const { url, token } = kvCredentials(tenant);
  return Boolean(url && token);
}

export function jobKey(id: string, tenantSlug?: string | null): string {
  const slug = tenantSlug?.trim() || getAlsTenant()?.slug?.trim();
  return slug ? `${KEY_PREFIX}${slug}:${id}` : `${KEY_PREFIX}${id}`;
}

async function resolveKvStore(tenant?: TenantConfig | null) {
  const { url, token } = kvCredentials(tenant);
  const mod = await import("@vercel/kv");
  if (url && token && typeof mod.createClient === "function") {
    return mod.createClient({ url, token });
  }
  if (isMultiTenantEnabled()) {
    throw new Error("kv_not_configured_for_tenant");
  }
  return mod.kv;
}

export async function mergeImportJob(
  id: string,
  patch: MergeImportJobPatch,
  tenant?: TenantConfig | null,
): Promise<void> {
  const store = await resolveKvStore(tenant);
  const key = jobKey(id, tenant?.slug);
  const prev = await store.get<ImportJobState>(key);
  const { activityAppend, activity: patchActivity, ...restPatch } = patch;
  let nextActivity = prev?.activity ?? [];
  if (activityAppend) {
    nextActivity = [...nextActivity, activityAppend].slice(-80);
  } else if (patchActivity !== undefined) {
    nextActivity = patchActivity;
  }
  const merged = {
    ...(prev ?? {}),
    ...restPatch,
    activity: nextActivity,
    updatedAt: Date.now(),
  } as ImportJobState;
  if (!merged.ownerId) {
    throw new Error("import_job_missing_owner");
  }
  await store.set(key, merged, { ex: TTL_SEC });
}

export async function readImportJob(
  id: string,
  tenant?: TenantConfig | null,
): Promise<ImportJobState | null> {
  if (!isKvImportConfigured(tenant)) return null;
  const store = await resolveKvStore(tenant);
  return store.get<ImportJobState>(jobKey(id, tenant?.slug));
}
