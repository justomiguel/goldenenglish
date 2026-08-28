import { BLOG_MEDIA_BUCKET } from "@/lib/blog/blogMedia";
import { uploadFileToSignedUrlWithProgress } from "@/lib/client/uploadFileToSignedUrlWithProgress";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

export type UploadedBlogMediaRef = {
  storagePath: string;
};

export type BlogMediaUploadProgress = {
  phase: "preparing" | "uploading";
  percent: number | null;
};

type SignedUploadOk = { ok: true; storagePath: string; token: string };

async function requestBlogMediaSignedUpload(input: {
  filename: string;
  contentType: string;
  byteSize: number;
  articleId?: string;
}): Promise<SignedUploadOk | { ok: false }> {
  const response = await fetch("/api/blog/media-signed-upload", {
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

export async function performBlogMediaFileUpload(
  file: File,
  articleId?: string,
  onProgress?: (progress: BlogMediaUploadProgress) => void,
): Promise<UploadedBlogMediaRef | null> {
  onProgress?.({ phase: "preparing", percent: 0 });
  const prepared = await requestBlogMediaSignedUpload({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
    articleId,
  });
  if (!prepared.ok) return null;
  onProgress?.({ phase: "uploading", percent: 0 });
  try {
    await uploadFileToSignedUrlWithProgress({
      supabaseUrl: readSupabasePublicEnv().url,
      bucket: BLOG_MEDIA_BUCKET,
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
