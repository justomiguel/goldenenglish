import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  extensionForEventUploadImage,
  mimeForEventUploadImageExt,
} from "@/lib/events/eventUploadPathDisplay";
import { EVENT_UPLOADS_BUCKET } from "@/lib/events/eventUploadsBucket";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface EventUploadImageExportPayload {
  bytes: Uint8Array;
  dataUrl: string;
  extension: "jpeg" | "png" | "gif" | "webp";
}

export async function downloadEventUploadImageForExport(
  adminClient: SupabaseClient,
  objectPath: string,
): Promise<EventUploadImageExportPayload | null> {
  const trimmed = objectPath.trim();
  if (!trimmed || trimmed.includes("..")) return null;

  const extension = extensionForEventUploadImage(trimmed);
  if (!extension) return null;

  const { data, error } = await adminClient.storage.from(EVENT_UPLOADS_BUCKET).download(trimmed);
  if (error || !data) {
    if (error) {
      logSupabaseClientError("downloadEventUploadImageForExport:storage", error, { path: trimmed });
    }
    return null;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > 8_000_000) return null;

  const mime = mimeForEventUploadImageExt(extension);
  return {
    bytes: new Uint8Array(buffer),
    dataUrl: `data:${mime};base64,${buffer.toString("base64")}`,
    extension,
  };
}
