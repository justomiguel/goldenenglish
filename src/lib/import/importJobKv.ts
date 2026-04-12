/**
 * Vercel KV (REST). Package `@vercel/kv` is deprecated in favor of Marketplace Redis;
 * env vars KV_REST_API_URL / KV_REST_API_TOKEN still work when linked from Vercel.
 */
import type { ImportJobState, MergeImportJobPatch } from "@/types/importJob";

export type { ImportJobState, ImportJobStatus, MergeImportJobPatch } from "@/types/importJob";

const KEY_PREFIX = "import:job:";
const TTL_SEC = 3600;

export function isKvImportConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim(),
  );
}

function jobKey(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

export async function mergeImportJob(id: string, patch: MergeImportJobPatch): Promise<void> {
  const { kv } = await import("@vercel/kv");
  const key = jobKey(id);
  const prev = await kv.get<ImportJobState>(key);
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
  await kv.set(key, merged, { ex: TTL_SEC });
}

export async function readImportJob(id: string): Promise<ImportJobState | null> {
  if (!isKvImportConfigured()) return null;
  const { kv } = await import("@vercel/kv");
  return kv.get<ImportJobState>(jobKey(id));
}
