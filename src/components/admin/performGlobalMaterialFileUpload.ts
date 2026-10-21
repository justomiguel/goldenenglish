import { prepareGlobalContentFileUploadAction } from "@/app/[locale]/dashboard/admin/academic/contents/globalContentFormDataActions";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import type { TrackedFileUploadProgress } from "@/lib/client/trackedFileUploadProgress";
import { LEARNING_TASK_ASSET_BUCKET } from "@/lib/learning-tasks/assets";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export type UploadedMaterialFileRef = {
  assetId: string;
  storagePath: string;
};

export async function performGlobalMaterialFileUpload(
  file: File,
  onProgress?: (progress: TrackedFileUploadProgress) => void,
): Promise<UploadedMaterialFileRef | null> {
  onProgress?.({ phase: "preparing", percent: 0 });
  const prepared = await prepareGlobalContentFileUploadAction({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
  });
  if (!prepared.ok) return null;
  onProgress?.({ phase: "uploading", percent: 0 });
  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: readSupabasePublicEnv().url,
      bucket: LEARNING_TASK_ASSET_BUCKET,
      storagePath: prepared.storagePath,
      token: prepared.token,
      file,
      onProgress: (percent) => onProgress?.({ phase: "uploading", percent }),
    });
  } catch {
    return null;
  }
  return { assetId: prepared.assetId, storagePath: prepared.storagePath };
}
