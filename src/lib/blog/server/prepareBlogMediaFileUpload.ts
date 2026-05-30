import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  BLOG_MEDIA_BUCKET,
  buildBlogMediaStoragePath,
} from "@/lib/blog/blogMedia";
import {
  validateLearningTaskFile,
} from "@/lib/learning-tasks/assets";
import {
  logServerException,
  logSupabaseClientError,
} from "@/lib/logging/serverActionLog";

const SignedUploadSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().min(1).max(50 * 1024 * 1024),
  articleId: z.string().uuid().optional(),
});

export type PrepareBlogMediaUploadResult =
  | { ok: true; storagePath: string; token: string }
  | { ok: false; code: "invalid_input" | "persist_failed" | "forbidden" };

export async function prepareBlogMediaFileUpload(
  supabase: SupabaseClient,
  actorId: string,
  raw: unknown,
): Promise<PrepareBlogMediaUploadResult> {
  const parsed = SignedUploadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_input" };

  const validation = validateLearningTaskFile({
    name: parsed.data.filename,
    size: parsed.data.byteSize,
    type: parsed.data.contentType,
  });
  if (!validation.ok) return { ok: false, code: "invalid_input" };

  try {
    const storagePath = buildBlogMediaStoragePath({
      articleId: parsed.data.articleId,
      actorId,
      mime: validation.mime,
    });
    const { data, error } = await supabase.storage
      .from(BLOG_MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data?.token) {
      logSupabaseClientError("blog.media.prepare_signed_upload", error, { storagePath });
      return { ok: false, code: "persist_failed" };
    }
    return { ok: true, storagePath, token: data.token };
  } catch (error) {
    logServerException("blog.media.prepare_signed_upload", error);
    return { ok: false, code: "persist_failed" };
  }
}

export async function removeBlogMediaStoragePath(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  const { error } = await supabase.storage.from(BLOG_MEDIA_BUCKET).remove([storagePath]);
  if (error) {
    logSupabaseClientError("blog.media.remove", error, { storagePath });
  }
}
