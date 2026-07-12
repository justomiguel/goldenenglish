import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/eventUploadsBucket";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

function sanitizeEventUploadPath(objectPath: string | null | undefined): string | null {
  const trimmed = objectPath?.trim();
  if (!trimmed || trimmed.includes("..")) return null;
  return trimmed;
}

export async function createEventUploadReadSignedUrl(
  objectPath: string | null | undefined,
  adminClient?: SupabaseClient,
): Promise<string | null> {
  const trimmed = sanitizeEventUploadPath(objectPath);
  if (!trimmed) return null;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = adminClient ?? createAdminClient();
  const { data, error } = await admin.storage.from(EVENT_UPLOADS_BUCKET).createSignedUrl(trimmed, 300);

  if (error || !data?.signedUrl) {
    if (error) {
      logSupabaseClientError("createEventUploadReadSignedUrl:storage", error, { path: trimmed });
    }
    return null;
  }
  return data.signedUrl;
}

export async function createEventUploadReadSignedUrlMap(
  objectPaths: string[],
  adminClient: SupabaseClient,
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(
      objectPaths
        .map((path) => sanitizeEventUploadPath(path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const result = new Map<string, string>();
  if (unique.length === 0) return result;

  const { data, error } = await adminClient.storage
    .from(EVENT_UPLOADS_BUCKET)
    .createSignedUrls(unique, 300);

  if (error) {
    logSupabaseClientError("createEventUploadReadSignedUrlMap:storage", error, {
      pathCount: unique.length,
    });
    return result;
  }

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl && !entry.error) {
      result.set(entry.path, entry.signedUrl);
    }
  }
  return result;
}
