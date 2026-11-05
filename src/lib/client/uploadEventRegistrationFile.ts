import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/eventUploadsBucket";
import { logClientWarn } from "@/lib/logging/clientLog";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export type UploadEventRegistrationFileResult =
  | { ok: true; path: string }
  | { ok: false; code: string };

export async function uploadEventRegistrationFile(input: {
  slug: string;
  locale: string;
  email: string;
  dniOrPassport: string;
  file: File;
  kind: "receipt" | "field";
  fieldId?: string;
  onProgress?: (percent: number) => void;
}): Promise<UploadEventRegistrationFileResult> {
  const response = await fetch(`/api/events/${encodeURIComponent(input.slug)}/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      dniOrPassport: input.dniOrPassport,
      locale: input.locale,
      fileName: input.file.name,
      mimeType: input.file.type,
      byteSize: input.file.size,
      kind: input.kind,
      fieldId: input.fieldId,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; code?: string; path?: string; token?: string }
    | null;

  if (!response.ok || !payload?.ok || !payload.path || !payload.token) {
    const code = payload?.code ?? `http_${response.status}`;
    logClientWarn("events.registerUpload", { code, status: response.status, kind: input.kind });
    return { ok: false, code };
  }

  const supabaseUrl = readSupabasePublicEnv().url;
  if (!supabaseUrl) {
    logClientWarn("events.registerUpload", { code: "no_storage_url", kind: input.kind });
    return { ok: false, code: "no_storage_url" };
  }

  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl,
      bucket: EVENT_UPLOADS_BUCKET,
      storagePath: payload.path,
      token: payload.token,
      file: input.file,
      onProgress: input.onProgress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "signed_upload_failed";
    const status = message.startsWith("signed_upload_http_")
      ? Number(message.slice("signed_upload_http_".length))
      : null;
    logClientWarn("events.registerUpload", {
      code: message,
      status,
      kind: input.kind,
    });
    return { ok: false, code: message };
  }

  return { ok: true, path: payload.path };
}
