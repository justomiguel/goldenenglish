import { prepareBlogMediaFileUploadAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import { BLOG_MEDIA_BUCKET } from "@/lib/blog/blogMedia";
import { createClient } from "@/lib/supabase/client";

export type UploadedBlogMediaRef = {
  storagePath: string;
};

export async function performBlogMediaFileUpload(
  file: File,
  articleId?: string,
): Promise<UploadedBlogMediaRef | null> {
  const prepared = await prepareBlogMediaFileUploadAction({
    filename: file.name,
    contentType: file.type,
    byteSize: file.size,
    articleId,
  });
  if (!prepared.ok) return null;
  const upload = await createClient().storage
    .from(BLOG_MEDIA_BUCKET)
    .uploadToSignedUrl(prepared.storagePath, prepared.token, file);
  if (upload.error) return null;
  return { storagePath: prepared.storagePath };
}
