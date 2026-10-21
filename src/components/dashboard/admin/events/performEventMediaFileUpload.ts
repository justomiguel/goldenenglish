import { prepareEventMediaFileUploadAction } from "@/app/[locale]/dashboard/admin/events/actions";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import type { TrackedFileUploadProgress } from "@/lib/client/trackedFileUploadProgress";
import { EVENT_MEDIA_BUCKET } from "@/lib/events/eventMedia";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export interface UploadedEventMediaRef {
  storagePath: string;
}

export async function performEventMediaFileUpload(
  file: File,
  eventId?: string,
  onProgress?: (progress: TrackedFileUploadProgress) => void,
): Promise<UploadedEventMediaRef | null> {
  onProgress?.({ phase: "preparing", percent: 0 });
  const prepared = await prepareEventMediaFileUploadAction({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
    eventId,
  });
  if (!prepared.ok) return null;
  onProgress?.({ phase: "uploading", percent: 0 });
  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: readSupabasePublicEnv().url,
      bucket: EVENT_MEDIA_BUCKET,
      storagePath: prepared.storagePath,
      token: prepared.token,
      file,
      onProgress: (percent) => onProgress?.({ phase: "uploading", percent }),
    });
  } catch {
    return null;
  }
  return { storagePath: prepared.storagePath };
}
