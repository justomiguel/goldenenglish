import { SHOP_MEDIA_BUCKET } from "@/lib/shop/shopMedia";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

type SignedUploadOk = { ok: true; storagePath: string; token: string };

async function requestShopMediaSignedUpload(input: {
  filename: string;
  contentType: string;
  byteSize: number;
  productId?: string;
}): Promise<SignedUploadOk | { ok: false }> {
  const response = await fetch("/api/shop/media-signed-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await response.json().catch(() => null)) as SignedUploadOk | { ok?: false } | null;
  if (!response.ok || !json || json.ok !== true || !json.storagePath || !json.token) {
    return { ok: false };
  }
  return { ok: true, storagePath: json.storagePath, token: json.token };
}

export async function performShopMediaFileUpload(
  file: File,
  productId?: string,
): Promise<{ storagePath: string } | null> {
  const prepared = await requestShopMediaSignedUpload({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
    productId,
  });
  if (!prepared.ok) return null;
  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: readSupabasePublicEnv().url,
      bucket: SHOP_MEDIA_BUCKET,
      storagePath: prepared.storagePath,
      token: prepared.token,
      file,
    });
  } catch {
    return null;
  }
  return { storagePath: prepared.storagePath };
}
