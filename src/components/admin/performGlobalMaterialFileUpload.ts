import { prepareGlobalContentFileUploadAction } from "@/app/[locale]/dashboard/admin/academic/contents/globalContentFormDataActions";
import { LEARNING_TASK_ASSET_BUCKET } from "@/lib/learning-tasks/assets";
import { createClient } from "@/lib/supabase/client";

export type UploadedMaterialFileRef = {
  assetId: string;
  storagePath: string;
};

export async function performGlobalMaterialFileUpload(file: File): Promise<UploadedMaterialFileRef | null> {
  const prepared = await prepareGlobalContentFileUploadAction({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
  });
  if (!prepared.ok) return null;
  const upload = await createClient().storage
    .from(LEARNING_TASK_ASSET_BUCKET)
    .uploadToSignedUrl(prepared.storagePath, prepared.token, file);
  if (upload.error) return null;
  return { assetId: prepared.assetId, storagePath: prepared.storagePath };
}
